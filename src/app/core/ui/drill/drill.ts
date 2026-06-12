import { Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentIndex } from '../../state/content-index';
import { InlinePart, InlineParts, splitInline } from '../blocks/blocks';

interface DrillCard {
  chapterTitle: string;
  slug: string;
  stepId?: string;
  kind: 'interview' | 'quiz';
  q: InlinePart[];
  a: InlinePart[][];
}

/**
 * Interview drill: every `interview` callout and every quiz question from all
 * ready chapters, aggregated into one flashcard-style review screen.
 */
@Component({
  selector: 'app-drill',
  imports: [RouterLink, InlineParts],
  templateUrl: './drill.html',
  styleUrl: './drill.scss',
})
export class Drill {
  private readonly contentIndex = inject(ContentIndex);

  protected readonly cards = resource({
    loader: async () => {
      const loaded = await this.contentIndex.loadAll();
      const cards: DrillCard[] = [];
      for (const { meta, content } of loaded) {
        for (const step of content.steps) {
          for (const b of step.blocks) {
            if (b.kind === 'callout' && b.tone === 'interview') {
              cards.push({
                chapterTitle: meta.title,
                slug: meta.slug,
                stepId: step.id,
                kind: 'interview',
                q: splitInline(b.title ?? 'שאלת ראיון'),
                a: (Array.isArray(b.body) ? b.body : [b.body]).map((l) => splitInline(l)),
              });
            }
          }
        }
        for (const q of content.quiz) {
          cards.push({
            chapterTitle: meta.title,
            slug: meta.slug,
            kind: 'quiz',
            q: splitInline(q.q),
            a: [splitInline(q.options[q.answer]), splitInline(q.explain)],
          });
        }
      }
      return cards;
    },
  });

  protected readonly revealed = signal<ReadonlySet<number>>(new Set());

  protected toggle(i: number): void {
    this.revealed.update((set) => {
      const next = new Set(set);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  protected revealAll(): void {
    const total = this.cards.value()?.length ?? 0;
    this.revealed.set(new Set(Array.from({ length: total }, (_, i) => i)));
  }

  protected hideAll(): void {
    this.revealed.set(new Set());
  }
}
