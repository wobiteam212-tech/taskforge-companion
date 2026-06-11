import { Component, input } from '@angular/core';

// תג סטטוס טיפש לחלוטין: tone נכנס, צבע יוצא. הצבעים נגזרים
// מהטוקנים של פרק 08 עם color-mix — אין כאן אף צבע קשיח.
@Component({
  selector: 'tf-badge',
  template: `<ng-content />`,
  styleUrl: './badge.scss',
  host: {
    class: 'tf-badge',
    '[class.tf-badge--open]': "tone() === 'open'",
    '[class.tf-badge--progress]': "tone() === 'progress'",
    '[class.tf-badge--done]': "tone() === 'done'",
    '[class.tf-badge--count]': "tone() === 'count'",
  },
})
export class TfBadge {
  readonly tone = input<'open' | 'progress' | 'done' | 'count'>('count');
}
