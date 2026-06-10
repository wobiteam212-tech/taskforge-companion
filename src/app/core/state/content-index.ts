import { Injectable } from '@angular/core';
import { ChapterContent, ChapterMeta } from '../registry/chapter.types';
import { READY_CHAPTERS } from '../registry/registry';

export interface LoadedChapter {
  meta: ChapterMeta;
  content: ChapterContent;
}

/**
 * Lazily loads (once) the content of every ready chapter — feeds the
 * cross-chapter features: search, the interview drill and the glossary.
 */
@Injectable({ providedIn: 'root' })
export class ContentIndex {
  private cache: Promise<LoadedChapter[]> | null = null;

  loadAll(): Promise<LoadedChapter[]> {
    this.cache ??= Promise.all(
      READY_CHAPTERS.filter((c) => c.loadContent).map(async (meta) => ({
        meta,
        content: await meta.loadContent!(),
      })),
    );
    return this.cache;
  }
}
