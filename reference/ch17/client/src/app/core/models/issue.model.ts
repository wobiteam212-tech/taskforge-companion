// המראה של server/TaskForge.Api/Contracts/IssueContracts.cs על הקו.

// #region step-7.5
// enums של C# עוברים על הקו כמחרוזות (JsonStringEnumConverter, פרק 04),
// בשמות החברים המקוריים. לכן כאן הם string unions ולא TS enum:
// הם מתעדים בדיוק את מה שה-JSON מכיל, בלי שום קוד בזמן ריצה.
export type IssueStatus = 'Open' | 'InProgress' | 'Done';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
// #endregion

/** המראה של LabelResponse */
export interface LabelRef {
  id: number;
  name: string;
  color: string | null;
}

/** המראה של IssueResponse — תאריכים מגיעים כמחרוזות ISO, לא כ-Date */
export interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: number;
  createdAtUtc: string;
  // #region step-17.10
  // ‏Rank מגיע כ-double מהשרת — מיקום ה-issue בעמודת הלוח. הלוח ממיין לפיו;
  // סידור-מחדש מחשב נקודת אמצע חדשה בין שני השכנים ושולח אותה בחזרה.
  rank: number;
  // #endregion
  labels: LabelRef[];
}

// #region step-13.2
// המראה של IssueListParams — הצד השני של [AsParameters] מפרק 04.
// אותם שמות, אותם defaults; ה-store ישמיט ברירות מחדל מה-URL היוצא.
// פרק 17 מוסיף 'rank' — סדר הלוח הידני, שבו תצוגת ה-Kanban משתמשת.
export type IssueSort = '-created' | 'created' | 'title' | 'priority' | 'rank';

export interface IssueListQuery {
  projectId: number;
  status: IssueStatus | null;
  search: string | null;
  sort: IssueSort;
  page: number;
  pageSize: number;
}

/** המראה של UpdateIssueRequest — ‏PUT הוא עדכון מלא, לא חלקי */
export interface UpdateIssueRequest {
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
}

export interface TitleAvailabilityResponse {
  available: boolean;
}
// #endregion
