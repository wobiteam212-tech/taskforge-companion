import { Component, input } from '@angular/core';

// #region step-9.3
// selector של attribute, לא של element: הכפתור נשאר <button> אמיתי —
// מקלדת, פוקוס, form submit ו-screen readers מקבלים הכול בחינם.
// הרכיב רק מוסיף זהות ויזואלית.
@Component({
  selector: 'button[tf-button], a[tf-button]',
  template: `<ng-content />`,
  styleUrl: './button.scss',
  host: {
    class: 'tf-btn',
    '[class.tf-btn--primary]': "variant() === 'primary'",
    '[class.tf-btn--ghost]': "variant() === 'ghost'",
    '[class.tf-btn--danger]': "variant() === 'danger'",
  },
})
export class TfButton {
  readonly variant = input<'primary' | 'ghost' | 'danger'>('primary');
}
// #endregion
