using System.ComponentModel.DataAnnotations;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

// #region step-12.5
// הצירוף הוא לפי אימייל — זה מה שהבעלים יודע להקליד. השרת מתרגם
// אימייל ל-UserId; הקליינט לא מנחש מזהים פנימיים לעולם.
public sealed record AddMemberRequest(
    [property: Required, EmailAddress] string Email,
    ProjectRole Role = ProjectRole.Member);

public sealed record MemberResponse(
    int UserId,
    string DisplayName,
    string Email,
    ProjectRole Role)
{
    public static MemberResponse FromInfo(ProjectMemberInfo info) =>
        new(info.UserId, info.DisplayName, info.Email, info.Role);
}
// #endregion
