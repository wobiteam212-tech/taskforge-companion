// המראה של server/TaskForge.Api/Contracts/AuthContracts.cs על הקו.
// השימוש המלא מגיע עם מסך ההתחברות (גל 3) — אבל החוזה מוגדר כבר עכשיו,
// כי הוא חלק מהשפה המשותפת של שני הצדדים.
export type UserRole = 'Member' | 'Admin';

/** המראה של UserResponse */
export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
}

/** המראה של AuthResponse — הזוג המלא + מתי ה-access פג */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: AuthUser;
}
