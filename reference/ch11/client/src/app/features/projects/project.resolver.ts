import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProjectSummary } from '../../core/models/project.model';
import { ProjectsStore } from '../../core/state/projects.store';

// #region step-11.8
// ה-resolver נשאר באותה חתימה ציבורית, אבל עכשיו הוא אסינכרוני.
// ProjectBoard ממשיך לקבל input בשם project, בלי לדעת אם הנתון בא ממוק או HTTP.
export const projectResolver: ResolveFn<ProjectSummary> = async (route) => {
  const store = inject(ProjectsStore);
  const id = Number(route.paramMap.get('projectId'));

  const project = await store.findProject(id);
  if (!project) throw new Error(`Project ${id} was not found after guard passed`);
  return project;
};
// #endregion
