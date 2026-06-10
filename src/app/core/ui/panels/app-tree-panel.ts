import { Component, input } from '@angular/core';
import { SourceBrowser } from '../source-browser/source-browser';

/**
 * Panel wrapper for the generated source browser. The selector stays stable for
 * existing chapter content, while the real tree UI is shared with the endcap.
 */
@Component({
  selector: 'app-tree-panel',
  imports: [SourceBrowser],
  templateUrl: './app-tree-panel.html',
  styleUrl: './app-tree-panel.scss',
})
export class AppTreePanel {
  readonly chapter = input.required<string>();
  readonly title = input<string>();
}
