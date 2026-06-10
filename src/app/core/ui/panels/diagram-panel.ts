import { Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '../../state/theme';

let seq = 0;

/**
 * Mermaid diagram card. Mermaid (~1MB) is loaded lazily via dynamic import the
 * first time a diagram actually renders — it never enters the initial bundle.
 * Re-renders when the theme toggles so diagram colors follow the forge theme.
 */
@Component({
  selector: 'diagram-panel',
  template: `
    <figure class="diagram-card">
      @if (svg(); as s) {
        <div class="mmd ltr" [innerHTML]="s"></div>
      } @else if (error(); as e) {
        <div class="mmd-error" role="alert">
          <strong>שגיאת דיאגרמה:</strong>
          <code class="ltr">{{ e }}</code>
        </div>
      } @else {
        <div class="mmd-loading" aria-hidden="true">טוען דיאגרמה…</div>
      }
      @if (caption()) {
        <figcaption class="cap">{{ caption() }}</figcaption>
      }
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }

    .diagram-card {
      margin: 0;
      border: 1px solid var(--bdr);
      border-radius: var(--rad);
      background: var(--sur);
      padding: 18px;
      box-shadow: var(--shadow-1);
    }

    .mmd {
      display: flex;
      justify-content: center;

      ::ng-deep svg {
        max-width: 100%;
        height: auto;
      }
    }

    .mmd-loading {
      color: var(--txt4);
      font-size: 13px;
      text-align: center;
      padding: 30px 0;
      animation: pulse 1.4s ease infinite;
    }

    .mmd-error {
      color: var(--txt);
      font-size: 13.5px;

      code {
        display: block;
        margin-top: 6px;
        color: var(--red);
        font-size: 12px;
        white-space: pre-wrap;
      }
    }

    .cap {
      margin-top: 12px;
      text-align: center;
      color: var(--txt3);
      font-size: 13px;
    }
  `,
})
export class DiagramPanel {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeSvc = inject(ThemeService);

  readonly mermaid = input.required<string>();
  readonly caption = input<string>();

  protected readonly svg = signal<SafeHtml | null>(null);
  protected readonly error = signal<string | null>(null);

  private renderToken = 0;

  constructor() {
    effect(() => {
      // tracked reads: diagram source + theme — re-render on either change
      const code = this.mermaid();
      const theme = this.themeSvc.theme();
      void this.render(code, theme, ++this.renderToken);
    });
  }

  private async render(code: string, theme: 'dark' | 'light', token: number): Promise<void> {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Heebo, Inter, sans-serif',
      });
      const { svg } = await mermaid.render(`mmd-${++seq}`, code);
      if (token !== this.renderToken) return; // a newer render superseded this one
      this.error.set(null);
      this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
    } catch (e) {
      if (token !== this.renderToken) return;
      this.svg.set(null);
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }
}
