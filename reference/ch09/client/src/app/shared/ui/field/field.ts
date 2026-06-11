import { Component, input } from '@angular/core';

// #region step-9.6
// העטיפה מספקת label, שגיאה ורמז — והשליטה עצמה (input, select, textarea)
// מוקרנת פנימה עם ng-content. הכול בתוך <label> אחד, כך שלחיצה על הטקסט
// ממקדת את השדה — אסוציאציה מובנית, בלי לנהל ידנית id ו-for.
@Component({
  selector: 'tf-field',
  templateUrl: './field.html',
  styleUrl: './field.scss',
})
export class TfField {
  readonly label = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
}
// #endregion
