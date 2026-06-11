import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'danger';
}

// #region step-9.10
// אותו דפוס store מפרק 07, בקטן: signal פרטי, asReadonly החוצה,
// שינוי רק דרך מתודות. כל toast מסלק את עצמו אחרי 4 שניות.
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  show(text: string, tone: Toast['tone'] = 'info'): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, text, tone }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
// #endregion
