// המראה של server/TaskForge.Core/Common/ProjectSummary.cs על הקו:
// בדיוק מה ש-GET /api/projects מחזיר לכל פרויקט — לא הישות, ההקרנה.
export interface ProjectSummary {
  id: number;
  name: string;
  description: string | null;
  openIssues: number;
}

// #region step-12.9
// המראה של ProjectResponse — מה ש-POST /api/projects מחזיר ב-201.
// הקליינט צריך בעיקר את ה-id, כדי לנווט ישר ללוח החדש.
export interface ProjectDetail {
  id: number;
  name: string;
  description: string | null;
  createdAtUtc: string;
}
// #endregion
