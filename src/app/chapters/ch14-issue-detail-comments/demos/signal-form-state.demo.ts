import { Component, computed, signal } from '@angular/core';
import { FormField, form, maxLength, minLength, required } from '@angular/forms/signals';

type DemoIssue = {
  title: string;
  body: string;
};

@Component({
  selector: 'signal-form-state-demo',
  imports: [FormField],
  templateUrl: './signal-form-state.demo.html',
  styleUrl: './signal-form-state.demo.scss',
})
export class SignalFormStateDemo {
  protected readonly model = signal<DemoIssue>({
    title: 'Fix login redirect loop',
    body: '',
  });

  protected readonly issueForm = form(this.model, (s) => {
    required(s.title, { message: 'Title is required' });
    minLength(s.title, 3, { message: 'Title must be at least 3 characters' });
    maxLength(s.title, 60, { message: 'Keep the title short for the card' });
    maxLength(s.body, 140, { message: 'Demo note is limited to 140 characters' });
  });

  protected readonly snapshot = computed(() => ({
    value: this.model(),
    title: this.issueForm.title(),
    body: this.issueForm.body(),
    form: this.issueForm(),
  }));

  protected readonly modelJson = computed(() => JSON.stringify(this.model(), null, 2));

  protected firstError(errors: readonly { message?: string; kind: string }[]): string {
    return errors[0]?.message ?? errors[0]?.kind ?? '';
  }
}
