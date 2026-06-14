// #region step-16.14
// המראה של Core/Common/SearchResults.cs על הקו — הקרנות רזות לקפיצה מהירה.
export interface ProjectHit {
  id: number;
  name: string;
}

export interface IssueHit {
  id: number;
  projectId: number;
  title: string;
  status: 'Open' | 'InProgress' | 'Done';
}

export interface SearchResults {
  projects: ProjectHit[];
  issues: IssueHit[];
}
// #endregion
