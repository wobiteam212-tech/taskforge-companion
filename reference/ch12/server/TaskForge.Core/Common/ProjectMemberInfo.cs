using TaskForge.Core.Entities;

namespace TaskForge.Core.Common;

// #region step-12.2
// אותו עיקרון כמו ProjectSummary מפרק 04: לא הישות על הקו — הקרנה.
// המסך צריך שם, אימייל ותפקיד; ה-PasswordHash לא עוזב את השרת לעולם.
public sealed record ProjectMemberInfo(
    int UserId,
    string DisplayName,
    string Email,
    ProjectRole Role);
// #endregion
