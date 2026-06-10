import { Component, input } from '@angular/core';
import { PanelDef } from '../../registry/chapter.types';
import { CodePanel, CodeDef } from './code-panel';
import { DiagramPanel } from './diagram-panel';
import { FiletreePanel } from './filetree-panel';
import { SimulatorPanel } from './simulator-panel';
import { LiveDemoPanel } from './live-demo-panel';
import { AppTreePanel } from './app-tree-panel';

/** Renders the right panel component for a step's PanelDef. */
@Component({
  selector: 'panel-host',
  imports: [CodePanel, DiagramPanel, FiletreePanel, SimulatorPanel, LiveDemoPanel, AppTreePanel],
  template: `
    @switch (def().kind) {
      @case ('code') {
        <code-panel [def]="asCode()" />
      }
      @case ('code-inline') {
        <code-panel [def]="asCode()" />
      }
      @case ('diagram') {
        <diagram-panel [mermaid]="asDiagram().mermaid" [caption]="asDiagram().caption" />
      }
      @case ('filetree') {
        <filetree-panel
          [lines]="asFiletree().lines"
          [title]="asFiletree().title"
          [caption]="asFiletree().caption"
        />
      }
      @case ('simulator') {
        <simulator-panel [scenario]="asSimulator().scenario" />
      }
      @case ('live-demo') {
        <live-demo-panel [load]="asLiveDemo().load" [caption]="asLiveDemo().caption" />
      }
      @case ('app-tree') {
        <app-tree-panel [chapter]="asAppTree().chapter" [title]="asAppTree().title" />
      }
    }
  `,
})
export class PanelHost {
  readonly def = input.required<PanelDef>();

  // typed views over the union — strictTemplates-friendly narrowing
  protected asCode(): CodeDef {
    return this.def() as CodeDef;
  }
  protected asDiagram(): Extract<PanelDef, { kind: 'diagram' }> {
    return this.def() as Extract<PanelDef, { kind: 'diagram' }>;
  }
  protected asFiletree(): Extract<PanelDef, { kind: 'filetree' }> {
    return this.def() as Extract<PanelDef, { kind: 'filetree' }>;
  }
  protected asSimulator(): Extract<PanelDef, { kind: 'simulator' }> {
    return this.def() as Extract<PanelDef, { kind: 'simulator' }>;
  }
  protected asLiveDemo(): Extract<PanelDef, { kind: 'live-demo' }> {
    return this.def() as Extract<PanelDef, { kind: 'live-demo' }>;
  }
  protected asAppTree(): Extract<PanelDef, { kind: 'app-tree' }> {
    return this.def() as Extract<PanelDef, { kind: 'app-tree' }>;
  }
}
