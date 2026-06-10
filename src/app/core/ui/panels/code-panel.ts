import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PanelDef } from '../../registry/chapter.types';
import { snapshotFile } from '../../source/manifest';
import { highlight, langFromFile } from '../../source/highlight';

export type CodeDef =
  | Extract<PanelDef, { kind: 'code' }>
  | Extract<PanelDef, { kind: 'code-inline' }>;

interface CodeVM {
  file: string;
  langLabel: string;
  code: string;
  html: SafeHtml;
  lines: number[];
  /** local (1-based) line numbers changed this chapter — diff gutter */
  changed: ReadonlySet<number>;
  note?: string;
  error?: string;
}

/**
 * The sticky code card. Two sources:
 *  - `code`        — a file from the verified reference snapshots (guide manifest),
 *                    optionally sliced to a named `// #region`, optionally with a
 *                    diff gutter marking the lines added/changed this chapter.
 *  - `code-inline` — literal code (shell commands, pre-snapshot config).
 * A missing manifest file/region renders a loud error card — authoring bugs
 * must never fail silently.
 */
@Component({
  selector: 'code-panel',
  templateUrl: './code-panel.html',
  styleUrl: './code-panel.scss',
})
export class CodePanel {
  private readonly sanitizer = inject(DomSanitizer);

  readonly def = input.required<CodeDef>();

  protected readonly copied = signal(false);

  protected readonly vm = computed<CodeVM>(() => {
    const d = this.def();
    try {
      if (d.kind === 'code-inline') {
        return this.toVm(d.file ?? '', d.lang, d.code, new Set());
      }
      const f = snapshotFile(d.chapter, d.file);
      let code = f.content;
      let offset = 0;
      let note: string | undefined;
      if (d.region) {
        const r = f.regions[d.region];
        if (!r) {
          throw new Error(`missing region "${d.region}" in ${d.file} (${d.chapter})`);
        }
        code = code.split('\n').slice(r.start - 1, r.end).join('\n');
        offset = r.start - 1;
        note = `קטע מתוך הקובץ (שורות ${r.start}–${r.end})`;
      }
      const lineCount = code.split('\n').length;
      const changed = new Set<number>();
      if (d.diff) {
        for (const n of f.changedLines) {
          const local = n - offset;
          if (local >= 1 && local <= lineCount) changed.add(local);
        }
      }
      return { ...this.toVm(d.file, langFromFile(d.file), code, changed), note };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        file: '',
        langLabel: '',
        code: '',
        html: this.sanitizer.bypassSecurityTrustHtml(''),
        lines: [],
        changed: new Set(),
        error: msg,
      };
    }
  });

  private toVm(file: string, lang: Parameters<typeof highlight>[1], code: string, changed: ReadonlySet<number>): CodeVM {
    return {
      file,
      langLabel: lang,
      code,
      html: this.sanitizer.bypassSecurityTrustHtml(highlight(code, lang)),
      lines: Array.from({ length: code.split('\n').length }, (_, i) => i + 1),
      changed,
    };
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.vm().code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1400);
    } catch {
      /* clipboard blocked — ignore */
    }
  }
}
