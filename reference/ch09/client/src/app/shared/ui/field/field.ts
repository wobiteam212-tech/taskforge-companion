import { AfterContentInit, Component, ElementRef, inject, input } from '@angular/core';

// #region step-9.6
// העטיפה מספקת label, שגיאה ורמז — והשליטה עצמה (input, select, textarea)
// מוקרנת פנימה עם ng-content. הכול בתוך <label> אחד, כך שלחיצה על הטקסט
// ממקדת את השדה — אסוציאציה מובנית, בלי לנהל ידנית id ו-for.
@Component({
  selector: 'tf-field',
  templateUrl: './field.html',
  styleUrl: './field.scss',
})
export class TfField implements AfterContentInit {
  private static nextId = 0;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);

  ngAfterContentInit(): void {
    const control = this.host.nativeElement.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input, select, textarea');
    if (!control) return;

    const base = this.label()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const generated = `tf-${base || 'field'}-${++TfField.nextId}`;

    if (!control.id) control.id = generated;
    if (!control.name) control.name = control.id;
  }
}
// #endregion
