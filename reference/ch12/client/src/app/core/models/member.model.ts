// #region step-12.12
// המראה של MemberResponse מהשרת. ה-Role הוא string union —
// ה-JsonStringEnumConverter מפרק 04 משדר enums כטקסט, לא כמספר.
export type ProjectRole = 'Member' | 'Owner';

export interface ProjectMember {
  userId: number;
  displayName: string;
  email: string;
  role: ProjectRole;
}
// #endregion
