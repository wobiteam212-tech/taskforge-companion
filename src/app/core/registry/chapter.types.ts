import { Type } from '@angular/core';

/* ============================================================
   The typed content model of the guide.
   A chapter = metadata (eagerly in the registry) + content
   (lazily imported per route). Content = scrollytelling steps,
   each step = Hebrew narrative blocks + ONE visual panel,
   plus end-of-chapter quiz / prove-it / exercise / terms.
   ============================================================ */

export type SourceLang =
  | 'typescript'
  | 'html'
  | 'scss'
  | 'css'
  | 'json'
  | 'bash'
  | 'csharp'
  | 'http'
  | 'sql'
  | 'yaml';

export type CalloutTone =
  | 'tip' // best practice
  | 'warn' // watch out
  | 'gotcha' // the mistake you'd actually make
  | 'why' // why this design and not another
  | 'alt' // the alternative and its trade-offs
  | 'dotnet10' // new in .NET 10
  | 'v22' // new in Angular v22
  | 'interview'; // title = the question, body = the model answer

/** One narrative block inside a step. All prose is Hebrew (RTL); code is LTR. */
export type ContentBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; lang: SourceLang; code: string; title?: string }
  | { kind: 'callout'; tone: CalloutTone; title?: string; body: string | string[] }
  /** glossary entry — auto-collected into the glossary page, rendered inline as a definition card */
  | { kind: 'term'; name: string; definition: string };

/* ---------- panels (the sticky visual side) ---------- */

export interface FileTreeLine {
  text: string;
  depth: number;
  kind?: 'dir' | 'file' | 'comment';
  /** 'new' = created this chapter, 'mod' = modified this chapter */
  badge?: 'new' | 'mod';
}

export interface DemoRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: string;
  note?: string;
}

export interface DemoResponse {
  status: number;
  title: string;
  body?: string;
}

export interface DemoScenario {
  title: string;
  blurb: string;
  requests: DemoRequest[];
  responses: DemoResponse[];
  insight?: string;
}

export type PanelDef =
  /** a file from the verified reference snapshots (the guide manifest) */
  | {
      kind: 'code';
      chapter: string;
      file: string;
      region?: string;
      /** highlight the lines added/changed in this chapter */
      diff?: boolean;
      title?: string;
    }
  /** literal code (shell commands, config you type before any snapshot exists) */
  | { kind: 'code-inline'; lang: SourceLang; code: string; file?: string }
  | { kind: 'diagram'; mermaid: string; caption?: string }
  | { kind: 'filetree'; title?: string; lines: FileTreeLine[]; caption?: string }
  | { kind: 'simulator'; scenario: DemoScenario }
  | { kind: 'live-demo'; load: () => Promise<Type<unknown>>; caption?: string }
  /** explorer over the cumulative snapshot state at a chapter */
  | { kind: 'app-tree'; chapter: string; title?: string };

/* ---------- steps & chapter content ---------- */

export interface StepDef {
  /** e.g. '0.3' — also used as the URL fragment (step-0.3) */
  id: string;
  title: string;
  blocks: ContentBlock[];
  panel: PanelDef;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  /** index into options */
  answer: number;
  explain: string;
}

export interface ProveItTask {
  title: string;
  body: string;
  /** command to run (LTR) */
  command?: string;
  /** what you should see */
  expect?: string;
}

export interface ExerciseDef {
  prompt: string;
  tasks: string[];
  acceptance: string[];
}

export interface ChapterContent {
  steps: StepDef[];
  quiz: QuizQuestion[];
  proveIt: ProveItTask[];
  exercise?: ExerciseDef;
}

/* ---------- registry metadata (eager) ---------- */

export interface ChapterMeta {
  /** e.g. 'ch00' — also the snapshot folder name under reference/ */
  id: string;
  no: number;
  /** route: /chapters/<slug> */
  slug: string;
  title: string;
  blurb: string;
  wave: number;
  /** 'ready' chapters get a route; 'soon' render as disabled roadmap cards */
  status: 'ready' | 'soon';
  /** lazily imports the heavy step content */
  loadContent?: () => Promise<ChapterContent>;
}

export interface WaveDef {
  no: number;
  title: string;
  tagline: string;
  chapters: ChapterMeta[];
}
