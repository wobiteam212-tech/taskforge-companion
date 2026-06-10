import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentIndex } from '../../state/content-index';

interface GlossEntry {
  name: string;
  definition: string;
  chapterTitle: string;
  slug: string;
  stepId: string;
}

/**
 * Glossary: every `term` block from every ready chapter, alphabetical,
 * each entry deep-linking back to the step that teaches it.
 */
@Component({
  selector: 'app-glossary',
  imports: [RouterLink],
  templateUrl: './glossary.html',
  styleUrl: './glossary.scss',
})
export class Glossary {
  private readonly contentIndex = inject(ContentIndex);

  protected readonly entries = resource({
    loader: async () => {
      const loaded = await this.contentIndex.loadAll();
      const entries: GlossEntry[] = [];
      for (const { meta, content } of loaded) {
        for (const step of content.steps) {
          for (const b of step.blocks) {
            if (b.kind === 'term') {
              entries.push({
                name: b.name,
                definition: b.definition,
                chapterTitle: meta.title,
                slug: meta.slug,
                stepId: step.id,
              });
            }
          }
        }
      }
      return entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    },
  });
}
