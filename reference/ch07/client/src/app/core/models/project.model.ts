// המראה של server/TaskForge.Core/Common/ProjectSummary.cs על הקו:
// בדיוק מה ש-GET /api/projects מחזיר לכל פרויקט — לא הישות, ההקרנה.
export interface ProjectSummary {
  id: number;
  name: string;
  description: string | null;
  openIssues: number;
}
