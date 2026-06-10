import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentBlock } from '../../registry/chapter.types';
import { highlight } from '../../source/highlight';

interface InlinePart {
  code: boolean;
  text: string;
}

/** Renders a run of Hebrew text + inline `code` segments (code stays LTR). */
@Component({
  selector: 'inline-parts',
  template: `@for (p of parts(); track $index) {
    @if (p.code) {
      <code class="ic">{{ p.text }}</code>
    } @else {
      <span>{{ p.text }}</span>
    }
  }`,
})
export class InlineParts {
  readonly parts = input.required<readonly InlinePart[]>();
}

/** Flat view-model so the template needs no union narrowing under strictTemplates. */
interface BlockVM {
  kind: ContentBlock['kind'];
  parts?: InlinePart[];
  items?: InlinePart[][];
  tone?: string;
  toneLabel?: string;
  title?: string;
  codeHtml?: SafeHtml;
  lang?: string;
  termName?: string;
}

const TONE_LABEL: Record<string, string> = {
  tip: 'טיפ',
  warn: 'שימו לב',
  gotcha: 'מלכודת',
  why: 'למה ככה?',
  alt: 'האלטרנטיבה',
  dotnet10: 'חדש ב-‎.NET 10',
  v22: 'חדש ב-Angular v22',
  interview: 'שאלת ראיון',
};

/** Renders the Hebrew narrative blocks of a step (the typed content model). */
@Component({
  selector: 'guide-blocks',
  imports: [InlineParts],
  templateUrl: './blocks.html',
  styleUrl: './blocks.scss',
})
export class Blocks {
  private readonly sanitizer = inject(DomSanitizer);

  readonly blocks = input.required<readonly ContentBlock[]>();

  protected readonly vm = computed<BlockVM[]>(() => this.blocks().map((b) => this.toVm(b)));

  private toVm(b: ContentBlock): BlockVM {
    switch (b.kind) {
      case 'p':
      case 'h':
        return { kind: b.kind, parts: this.inline(b.text) };
      case 'ul':
      case 'ol':
        return { kind: b.kind, items: b.items.map((i) => this.inline(i)) };
      case 'callout':
        return {
          kind: 'callout',
          tone: b.tone,
          toneLabel: TONE_LABEL[b.tone] ?? '',
          title: b.title,
          items: this.asLines(b.body).map((l) => this.inline(l)),
        };
      case 'term':
        return {
          kind: 'term',
          termName: b.name,
          parts: this.inline(b.definition),
        };
      case 'code':
        return {
          kind: 'code',
          title: b.title,
          lang: b.lang,
          codeHtml: this.sanitizer.bypassSecurityTrustHtml(highlight(b.code, b.lang)),
        };
    }
  }

  private asLines(body: string | string[]): string[] {
    return Array.isArray(body) ? body : [body];
  }

  /** Split a string into plain + inline-`code` segments. */
  private inline(text: string): InlinePart[] {
    const parts: InlinePart[] = [];
    const re = /`([^`]+)`/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push({ code: false, text: text.slice(last, m.index) });
      parts.push({ code: true, text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ code: false, text: text.slice(last) });
    return parts.length ? parts : [{ code: false, text }];
  }
}
