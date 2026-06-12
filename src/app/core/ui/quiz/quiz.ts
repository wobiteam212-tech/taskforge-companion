import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { QuizQuestion } from '../../registry/chapter.types';
import { ProgressService } from '../../state/progress';
import { InlinePart, InlineParts, splitInline } from '../blocks/blocks';

/**
 * End-of-chapter checkpoint quiz. Immediate feedback per question,
 * explanation after answering, score persisted via ProgressService.
 */
@Component({
  selector: 'chapter-quiz',
  imports: [InlineParts],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz {
  private readonly progress = inject(ProgressService);

  readonly questions = input.required<readonly QuizQuestion[]>();
  readonly chapterId = input.required<string>();

  /** Inline-code aware view of each question (backticks become <code>). */
  protected readonly qParts = computed<
    { q: InlinePart[]; options: InlinePart[][]; explain: InlinePart[] }[]
  >(() =>
    this.questions().map((q) => ({
      q: splitInline(q.q),
      options: q.options.map((o) => splitInline(o)),
      explain: splitInline(q.explain),
    })),
  );

  /** answers[i] = selected option index, or null if unanswered */
  protected readonly answers = signal<readonly (number | null)[]>([]);

  protected readonly answeredCount = computed(
    () => this.answers().filter((a) => a !== null).length,
  );

  protected readonly score = computed(() =>
    this.questions().reduce(
      (acc, q, i) => acc + (this.answers()[i] === q.answer ? 1 : 0),
      0,
    ),
  );

  protected readonly allAnswered = computed(
    () => this.questions().length > 0 && this.answeredCount() === this.questions().length,
  );

  constructor() {
    // reset answers when the question set changes
    effect(() => {
      this.answers.set(this.questions().map(() => null));
    });
    // persist the score once the quiz is complete
    effect(() => {
      if (this.allAnswered()) {
        this.progress.setQuizScore(this.chapterId(), this.score(), this.questions().length);
      }
    });
  }

  protected pick(qi: number, oi: number): void {
    if (this.answers()[qi] !== null) return; // locked after first pick
    this.answers.update((arr) => arr.map((a, i) => (i === qi ? oi : a)));
  }

  protected reset(): void {
    this.answers.set(this.questions().map(() => null));
  }

  protected stateOf(qi: number, oi: number): 'correct' | 'wrong' | 'idle' | 'reveal' {
    const picked = this.answers()[qi];
    if (picked === null) return 'idle';
    const correct = this.questions()[qi].answer;
    if (oi === correct) return picked === correct && oi === picked ? 'correct' : 'reveal';
    return oi === picked ? 'wrong' : 'idle';
  }
}
