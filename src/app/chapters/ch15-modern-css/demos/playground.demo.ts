import { Component, signal } from '@angular/core';

interface LabCard {
  id: number;
  title: string;
  meta: string;
}

/**
 * מעבדת CSS מודרני: שולטים ברוחב ה-container (לא ב-viewport) ובמנגנון הפריסה,
 * ורואים בזמן אמת איך grid / subgrid / flex מגיבים, איך container query מקפל
 * לעמודה אחת, ו-`:has()` נותן ל-parent להגיב לבחירה — בלי class, בלי signal.
 */
@Component({
  selector: 'demo-css-playground',
  templateUrl: './playground.demo.html',
  styleUrl: './playground.demo.scss',
})
export class CssPlaygroundDemo {
  protected readonly mode = signal<'grid' | 'subgrid' | 'flex'>('grid');
  protected readonly width = signal(520);

  protected readonly modes: ReadonlyArray<'grid' | 'subgrid' | 'flex'> = ['grid', 'subgrid', 'flex'];

  protected readonly cards: LabCard[] = [
    { id: 1, title: 'Fix login redirect', meta: 'Critical' },
    { id: 2, title: 'New hero section', meta: 'Medium' },
    { id: 3, title: 'Polish the navbar', meta: 'Low' },
    { id: 4, title: 'Push notifications', meta: 'High' },
    { id: 5, title: 'Cold-start crash', meta: 'Critical' },
    { id: 6, title: 'Search box', meta: 'Low' },
  ];

  protected onWidth(event: Event): void {
    this.width.set(Number((event.target as HTMLInputElement).value));
  }
}
