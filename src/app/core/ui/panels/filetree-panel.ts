import { Component, input } from '@angular/core';
import { FileTreeLine } from '../../registry/chapter.types';

/** Static file-tree card — shows where files live and what's new this chapter. */
@Component({
  selector: 'filetree-panel',
  template: `
    <figure class="tree-card">
      @if (title()) {
        <figcaption class="tree-title ltr">{{ title() }}</figcaption>
      }
      <div class="tree ltr" role="img" [attr.aria-label]="title() || 'file tree'">
        @for (line of lines(); track $index) {
          <div
            class="row"
            [class.row--dir]="line.kind === 'dir'"
            [class.row--comment]="line.kind === 'comment'"
            [style.padding-inline-start.px]="14 + line.depth * 18"
          >
            <span class="txt">{{ line.text }}</span>
            @if (line.badge === 'new') {
              <span class="b b--new">new</span>
            } @else if (line.badge === 'mod') {
              <span class="b b--mod">mod</span>
            }
          </div>
        }
      </div>
      @if (caption()) {
        <figcaption class="cap">{{ caption() }}</figcaption>
      }
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }

    .tree-card {
      margin: 0;
      border: 1px solid var(--code-bdr);
      border-radius: var(--rad);
      background: var(--code-bg);
      overflow: hidden;
      box-shadow: var(--shadow-1);
    }

    .tree-title {
      padding: 9px 14px;
      border-bottom: 1px solid var(--code-bdr);
      color: #c4cbdc;
      font-size: 12.5px;
      font-family: var(--mono);
    }

    .tree {
      padding: 12px 0;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.9;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-inline-end: 14px;
      color: #aeb6c8;
      white-space: nowrap;
    }

    .row--dir .txt {
      color: var(--ember2);
      font-weight: 600;
    }

    .row--comment .txt {
      color: #5d6477;
      font-style: italic;
    }

    .b {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 999px;
      padding: 0 8px;
    }

    .b--new {
      color: var(--grn);
      background: var(--gdim);
    }

    .b--mod {
      color: var(--ylw);
      background: var(--ydim);
    }

    .cap {
      padding: 10px 14px;
      border-top: 1px solid var(--code-bdr);
      color: #8b93a7;
      font-size: 12.5px;
      direction: rtl;
      text-align: start;
      font-family: var(--heb);
    }
  `,
})
export class FiletreePanel {
  readonly lines = input.required<readonly FileTreeLine[]>();
  readonly title = input<string>();
  readonly caption = input<string>();
}
