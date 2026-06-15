import { IssuePriority, IssueStatus } from './issue.model';

// #region step-18.13
// המראה של חוזי הדשבורד על הקו. ProjectStats מקביל ל-Core/Common/ProjectStats,
// ו-ActivityEvent ל-ActivityResponse. ה-DateOnly של השרת מגיע כמחרוזת ISO
// ('2026-01-14'); enums מגיעים כמחרוזות (JsonStringEnumConverter מפרק 04).
export interface StatusCount {
  status: IssueStatus;
  count: number;
}

export interface PriorityCount {
  priority: IssuePriority;
  count: number;
}

export interface DayCount {
  day: string; // 'YYYY-MM-DD'
  count: number;
}

export interface ProjectStats {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  byStatus: StatusCount[];
  byPriority: PriorityCount[];
  createdPerDay: DayCount[];
}

// #region step-19.13b
// פרק 19 מוסיף 'AttachmentAdded' ל-union — מקביל לערך החדש ב-enum ActivityType
// בשרת. ה-timeline של מסך הפרטים מציג גם אירועי צירוף קובץ.
export type ActivityType = 'IssueCreated' | 'IssueMoved' | 'CommentAdded' | 'AttachmentAdded';
// #endregion

export interface ActivityEvent {
  id: number;
  type: ActivityType;
  summary: string;
  issueId: number | null;
  actorName: string;
  createdAtUtc: string;
}
// #endregion
