import { Injectable, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { API_BASE } from '../../core/api/api';
import { TokenStore } from '../../core/auth/token.store';
import { SearchResults } from '../../core/models/search.model';

// #region step-16.15
// אותו דפוס httpResource ריאקטיבי מפרק 11/12: ה-query הוא signal,
// וה-URL נגזר ממנו. מתחת ל-2 תווים או בלי login -> undefined = אין בקשה.
// ה-palette כותב ל-setQuery (עם debounce), ה-resource עושה את השאר.
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly tokenStore = inject(TokenStore);

  private readonly query = signal('');

  setQuery(value: string): void {
    this.query.set(value.trim());
  }

  private readonly resource = httpResource<SearchResults>(() => {
    const q = this.query();
    if (q.length < 2 || !this.tokenStore.isLoggedIn()) return undefined;
    return `${API_BASE}/search?q=${encodeURIComponent(q)}`;
  });

  readonly results = computed<SearchResults>(() =>
    this.resource.hasValue() ? this.resource.value() : { projects: [], issues: [] },
  );
}
// #endregion
