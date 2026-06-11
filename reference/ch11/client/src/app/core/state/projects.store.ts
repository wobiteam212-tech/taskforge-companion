import { Injectable, computed, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { ProjectSummary } from '../models/project.model';

// הסים משלם: ה-SEED מפרק 07 נמחק, הנתונים מגיעים מ-SQLite דרך ה-API —
// והציבור של ה-store נשאר זהה. אף קומפוננטה לא השתנתה בגלל ההחלפה הזו.
@Injectable({ providedIn: 'root' })
export class ProjectsStore {
  private readonly http = inject(HttpClient);

  // #region step-11.5
  // httpResource: בקשת GET שהיא signal. היא יוצאת מעצמה, יודעת לרענן,
  // וחושפת hasValue / value / isLoading / error — בלי subscribe ובלי ניהול ידני.
  private readonly projectsResource = httpResource<ProjectSummary[]>(
    () => `${API_BASE}/projects`,
    { defaultValue: [] },
  );
  // #endregion

  // #region step-11.6
  /** אותו ציבור בדיוק כמו בעידן המוק — הקוראים לא יודעים שמשהו השתנה */
  readonly projects = computed(() =>
    this.projectsResource.hasValue() ? this.projectsResource.value() : [],
  );

  readonly loading = computed(() => this.projectsResource.isLoading());

  readonly loadError = computed(() => this.projectsResource.error());

  readonly totalOpenIssues = computed(() =>
    this.projects().reduce((sum, p) => sum + p.openIssues, 0),
  );
  // #endregion

  // #region step-11.7
  private readonly projectCache = new Map<number, ProjectSummary>();

  async findProject(id: number): Promise<ProjectSummary | undefined> {
    const fromCurrentList = this.projects().find((p) => p.id === id);
    if (fromCurrentList) {
      this.projectCache.set(id, fromCurrentList);
      return fromCurrentList;
    }

    const fromCache = this.projectCache.get(id);
    if (fromCache) return fromCache;

    const projects = await firstValueFrom(this.http.get<ProjectSummary[]>(`${API_BASE}/projects`));
    for (const project of projects) this.projectCache.set(project.id, project);
    return this.projectCache.get(id);
  }
  // #endregion

  // #region step-11.12
  // כתיבה היא פקודה: POST אמיתי (דורש Bearer — ה-interceptor מצרף),
  // ואז reload כדי שה-id והספירות יגיעו מהשרת — לא מנוחשים בקליינט.
  async addProject(name: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${API_BASE}/projects`, { name, description: null }),
    );
    this.projectsResource.reload();
  }
  // #endregion
}
