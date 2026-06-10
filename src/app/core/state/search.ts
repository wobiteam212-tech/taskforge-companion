import { Injectable, inject } from '@angular/core';
import { ContentBlock } from '../registry/chapter.types';
import { ContentIndex } from './content-index';

export interface SearchHit {
  chapterId: string;
  slug: string;
  chapterTitle: string;
  stepId?: string;
  title: string;
  snippet: string;
}

interface Doc {
  chapterId: string;
  slug: string;
  chapterTitle: string;
  stepId?: string;
  title: string;
  text: string;
}

/** Full-text search over every ready chapter (titles, prose, callouts, terms). */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly contentIndex = inject(ContentIndex);
  private docs: Doc[] | null = null;

  async search(query: string): Promise<SearchHit[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const docs = await this.ensureDocs();
    const hits: SearchHit[] = [];
    for (const d of docs) {
      const inTitle = d.title.toLowerCase().includes(q);
      const idx = d.text.toLowerCase().indexOf(q);
      if (!inTitle && idx < 0) continue;
      hits.push({
        chapterId: d.chapterId,
        slug: d.slug,
        chapterTitle: d.chapterTitle,
        stepId: d.stepId,
        title: d.title,
        snippet: idx >= 0 ? this.snippet(d.text, idx, q.length) : d.text.slice(0, 90),
      });
      if (hits.length >= 12) break;
    }
    return hits;
  }

  private async ensureDocs(): Promise<Doc[]> {
    if (this.docs) return this.docs;
    const loaded = await this.contentIndex.loadAll();
    const docs: Doc[] = [];
    for (const { meta, content } of loaded) {
      docs.push({
        chapterId: meta.id,
        slug: meta.slug,
        chapterTitle: meta.title,
        title: meta.title,
        text: meta.blurb,
      });
      for (const step of content.steps) {
        docs.push({
          chapterId: meta.id,
          slug: meta.slug,
          chapterTitle: meta.title,
          stepId: step.id,
          title: step.title,
          text: step.blocks.map((b) => this.blockText(b)).join(' '),
        });
      }
    }
    this.docs = docs;
    return docs;
  }

  private blockText(b: ContentBlock): string {
    switch (b.kind) {
      case 'p':
      case 'h':
        return b.text;
      case 'ul':
      case 'ol':
        return b.items.join(' ');
      case 'callout':
        return [b.title ?? '', ...(Array.isArray(b.body) ? b.body : [b.body])].join(' ');
      case 'term':
        return `${b.name} ${b.definition}`;
      case 'code':
        return b.title ?? '';
    }
  }

  private snippet(text: string, idx: number, len: number): string {
    const start = Math.max(0, idx - 36);
    const end = Math.min(text.length, idx + len + 56);
    return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
  }
}
