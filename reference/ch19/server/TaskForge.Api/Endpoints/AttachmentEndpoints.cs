using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class AttachmentEndpoints
{
    // קובץ עד 5MB — מגבלה פשוטה שמונעת העלאות ענק ל-DB בפיתוח
    private const long MaxBytes = 5 * 1024 * 1024;
    private const long MaxRequestBytes = MaxBytes + 64 * 1024; // multipart headers + file part overhead

    // #region step-19.5
    public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder app)
    {
        var perIssue = app.MapGroup("/api/issues/{issueId:int}/attachments")
            .WithTags("Attachments")
            .RequireAuthorization();

        perIssue.MapGet("/", ListAttachments);
        // DisableAntiforgery: ה-SPA שולח Bearer, לא קוקי — אין סיכון CSRF, ולכן
        // מוותרים על דרישת ה-antiforgery token שמינimal API מבקש כברירת מחדל ל-multipart.
        perIssue.MapPost("/", UploadAttachment)
            .DisableAntiforgery()
            .WithMetadata(
                new RequestSizeLimitAttribute(MaxRequestBytes),
                new RequestFormLimitsAttribute { MultipartBodyLengthLimit = MaxBytes });

        var byId = app.MapGroup("/api/attachments")
            .WithTags("Attachments")
            .RequireAuthorization();

        byId.MapGet("/{id:int}", DownloadAttachment);

        return app;
    }
    // #endregion

    // #region step-19.6
    private static async Task<Results<Ok<IReadOnlyList<AttachmentResponse>>, NotFound, ForbidHttpResult>> ListAttachments(
        int issueId,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        IAttachmentRepository attachments,
        CancellationToken cancellationToken)
    {
        var issue = await issues.GetByIdAsync(issueId, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        var mapped = (await attachments.GetMetadataByIssueAsync(issueId, cancellationToken))
            .Select(AttachmentResponse.FromEntity)
            .ToList();

        return TypedResults.Ok<IReadOnlyList<AttachmentResponse>>(mapped);
    }

    // multipart: ה-IFormFile נקשר אוטומטית מה-form. בודקים גודל לפני שקוראים
    // את כל הזרם לזיכרון, ורושמים אירוע פעילות ליד ההעלאה.
    private static async Task<Results<Created<AttachmentResponse>, NotFound, ForbidHttpResult, BadRequest<string>>> UploadAttachment(
        int issueId,
        IFormFile file,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        IAttachmentRepository attachments,
        IActivityRepository activity,
        CancellationToken cancellationToken)
    {
        var issue = await issues.GetByIdAsync(issueId, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        if (file.Length == 0)
        {
            return TypedResults.BadRequest("הקובץ ריק");
        }

        if (file.Length > MaxBytes)
        {
            return TypedResults.BadRequest("הקובץ גדול מ-5MB");
        }

        var fileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return TypedResults.BadRequest("שם הקובץ חסר");
        }

        if (fileName.Length > 260)
        {
            return TypedResults.BadRequest("שם הקובץ ארוך מדי");
        }

        var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
        if (contentType.Length > 120)
        {
            return TypedResults.BadRequest("סוג הקובץ ארוך מדי");
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);

        var saved = await attachments.AddAsync(new Attachment
        {
            IssueId = issueId,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = file.Length,
            Bytes = stream.ToArray(),
            UploadedByUserId = user.GetUserId(),
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);

        await activity.LogAsync(new ActivityEvent
        {
            ProjectId = issue.ProjectId,
            IssueId = issueId,
            ActorUserId = user.GetUserId(),
            Type = ActivityType.AttachmentAdded,
            Summary = $"צירף/ה קובץ \"{saved.FileName}\"",
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);

        // ה-entity שחזר מ-AddAsync לא טוען את ה-nav של UploadedBy, אז משלימים
        // את שם המעלה מה-claim "name" שבטוקן — כך ה-201 כבר מציג את השם הנכון.
        var uploaderName = user.FindFirstValue("name") ?? "Unknown";
        return TypedResults.Created(
            $"/api/attachments/{saved.Id}",
            AttachmentResponse.FromEntity(saved) with { UploadedByName = uploaderName });
    }

    // ההורדה: שולפים כולל bytes, מאמתים חברות דרך ה-issue, ומחזירים File
    // עם ה-content-type המקורי כדי שהדפדפן ידע מה לעשות עם הקובץ.
    private static async Task<Results<FileContentHttpResult, NotFound, ForbidHttpResult>> DownloadAttachment(
        int id,
        ClaimsPrincipal user,
        IAttachmentRepository attachments,
        IIssueRepository issues,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        var attachment = await attachments.GetByIdAsync(id, cancellationToken);
        if (attachment is null)
        {
            return TypedResults.NotFound();
        }

        var issue = await issues.GetByIdAsync(attachment.IssueId, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        return TypedResults.File(attachment.Bytes, attachment.ContentType, attachment.FileName);
    }
    // #endregion
}
