import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { IssuePriority } from '../../core/models/issue.model';

const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

// #region step-14.15
@Component({
  selector: 'tf-priority-picker',
  templateUrl: './priority-picker.html',
  styleUrl: './priority-picker.scss',
})
export class PriorityPicker implements FormValueControl<IssuePriority> {
  readonly value = model<IssuePriority>('Medium');
  readonly disabled = input(false);

  protected readonly priorities = PRIORITIES;

  protected choose(priority: IssuePriority): void {
    if (!this.disabled()) {
      this.value.set(priority);
    }
  }
}
// #endregion
