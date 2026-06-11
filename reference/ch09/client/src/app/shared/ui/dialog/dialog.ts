import { Component, ElementRef, effect, input, model, viewChild } from '@angular/core';

// #region step-9.8
// עטיפה דקה ל-<dialog> המקורי של הפלטפורמה: showModal נותן בחינם
// פוקוס כלוא, Escape, ו-backdrop. אנחנו רק מגשרים בין עולם ה-signals
// לעולם ה-DOM הציווי — לכל כיוון.
@Component({
  selector: 'tf-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class TfDialog {
  /** two-way: ההורה כותב true כדי לפתוח; הדיאלוג כותב false כשנסגר */
  readonly open = model(false);

  readonly heading = input.required<string>();

  // לא required: ההרצה הראשונה של effect עלולה לקרות לפני שה-query התיישב,
  // והגנה שקטה עדיפה על NG0951 בזמן ריצה.
  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    // signal משתנה ואז DOM מצווה — effect הוא בדיוק הגשר הזה
    effect(() => {
      const el = this.dlg()?.nativeElement;
      if (!el) return;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  // המשתמש סגר עם Escape או שהדפדפן סגר — מסנכרנים חזרה את ה-model
  protected onNativeClose(): void {
    this.open.set(false);
  }
}
// #endregion
