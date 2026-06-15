import {
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { renderMarkdown } from '../../../core/markdown/markdown';

// #region step-19.14
// עורך Markdown כ-custom form control (ממשיך את priority-picker מפרק 14):
// מממש FormValueControl<string>, ולכן עובד עם [formField] כמו כל input רגיל.
// שלושה דברים: textarea, מתג תצוגה מקדימה (Markdown מרונדר ובטוח), ו-@mention
// autocomplete שצץ כשמקלידים @ — רשימת חברים מסוננת, בחירה מזריקה את השם.
@Component({
  selector: 'tf-markdown-editor',
  templateUrl: './markdown-editor.html',
  styleUrl: './markdown-editor.scss',
})
export class MarkdownEditor implements FormValueControl<string> {
  readonly value = model<string>('');
  readonly disabled = input(false);
  readonly rows = input(4);
  readonly placeholder = input('');
  /** שמות החברים שאפשר להזכיר ב-@ */
  readonly mentionCandidates = input<string[]>([]);

  private readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('ta');

  protected readonly preview = signal(false);
  protected readonly rendered = computed(() => renderMarkdown(this.value() || ''));

  // ה-query של ה-@mention: null = אין הזכרה פעילה כרגע
  protected readonly mentionQuery = signal<string | null>(null);
  protected readonly activeMention = signal(0);

  protected readonly mentionMatches = computed<string[]>(() => {
    const query = this.mentionQuery();
    if (query === null) return [];
    const lower = query.toLowerCase();
    return this.mentionCandidates()
      .filter((name) => name.toLowerCase().includes(lower))
      .slice(0, 5);
  });

  protected onInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.value.set(ta.value);
    this.detectMention(ta);
  }

  // מזהים @word שמסתיים בדיוק בסמן — זו ההזכרה שעורכים עכשיו
  private detectMention(ta: HTMLTextAreaElement): void {
    const caret = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, caret);
    const match = /@([\w.-]*)$/.exec(before);
    this.mentionQuery.set(match ? match[1] : null);
    this.activeMention.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const matches = this.mentionMatches();
    if (!matches.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeMention.update((i) => (i + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeMention.update((i) => (i - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.choose(matches[this.activeMention()]);
    } else if (event.key === 'Escape') {
      this.mentionQuery.set(null);
    }
  }

  // בחירת חבר: מחליפים את ה-@word שלפני הסמן בשם המלא, וסוגרים את ה-popover
  protected choose(name: string): void {
    const ta = this.textarea().nativeElement;
    const caret = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, caret).replace(/@([\w.-]*)$/, `@${name} `);
    const after = ta.value.slice(caret);
    const next = before + after;

    this.value.set(next);
    this.mentionQuery.set(null);

    // מחזירים פוקוס וסמן אחרי ההזרקה
    queueMicrotask(() => {
      ta.value = next;
      ta.focus();
      ta.setSelectionRange(before.length, before.length);
    });
  }

  protected togglePreview(): void {
    this.preview.update((p) => !p);
  }
}
// #endregion
