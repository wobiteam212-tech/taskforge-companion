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
  labels: LabelRef[];
}
