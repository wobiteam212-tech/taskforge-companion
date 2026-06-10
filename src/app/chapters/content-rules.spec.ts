import { describe, expect, it } from 'vitest';
import { READY_CHAPTERS } from '../core/registry/registry';
import {
  ChapterContent,
  ContentBlock,
  PanelDef,
  StepDef,
} from '../core/registry/chapter.types';
import { chapterSnapshot, snapshotFile } from '../core/source/manifest';

/**
 * The content quality gate. Every READY chapter must pass these rules —
 * they encode the house authoring contract (HireHub lessons + plan §3.5),
 * so delegated or hand-written content meets the exact same bar.
 */

// Hebrew prose must never contain unicode arrows (bidi chaos in RTL).
const FORBIDDEN = /[→➜⇒←⟵⟶↦⮕]/;

function proseStrings(b: ContentBlock): string[] {
  switch (b.kind) {
    case 'p':
    case 'h':
      return [b.text];
    case 'ul':
    case 'ol':
      return b.items;
    case 'callout':
      return [b.title ?? '', ...(Array.isArray(b.body) ? b.body : [b.body])];
    case 'term':
      return [b.name, b.definition];
    case 'code':
      return []; // code is LTR; ASCII arrows like --> are fine there
  }
}

function panelProse(p: PanelDef): string[] {
  switch (p.kind) {
    case 'diagram':
      return [p.caption ?? ''];
    case 'filetree':
      return [p.caption ?? '', p.title ?? '', ...p.lines.map((l) => l.text)];
    case 'simulator':
      return [
        p.scenario.title,
        p.scenario.blurb,
        p.scenario.insight ?? '',
        ...p.scenario.requests.map((r) => r.note ?? ''),
        ...p.scenario.responses.map((r) => r.title),
      ];
    case 'live-demo':
      return [p.caption ?? ''];
    case 'code':
      return [p.title ?? ''];
    default:
      return [];
  }
}

const loaded = await Promise.all(
  READY_CHAPTERS.map(async (meta) => ({
    meta,
    content: (await meta.loadContent!()) as ChapterContent,
  })),
);

describe.each(loaded)('chapter $meta.id content rules', ({ meta, content }) => {
  it('has steps with unique ids, titles, blocks and exactly one panel each', () => {
    expect(content.steps.length).toBeGreaterThanOrEqual(8);
    const ids = new Set<string>();
    for (const step of content.steps) {
      expect(step.id, `step id in ${meta.id}`).toBeTruthy();
      expect(ids.has(step.id), `duplicate step id ${step.id}`).toBe(false);
      ids.add(step.id);
      expect(step.title.length, `title of ${step.id}`).toBeGreaterThan(3);
      expect(step.blocks.length, `blocks of ${step.id}`).toBeGreaterThan(0);
      expect(step.panel, `panel of ${step.id}`).toBeTruthy();
    }
  });

  it('contains no forbidden arrows in Hebrew prose', () => {
    for (const step of content.steps) {
      for (const s of [step.title, ...step.blocks.flatMap(proseStrings), ...panelProse(step.panel)]) {
        expect(FORBIDDEN.test(s), `arrow in ${meta.id} step ${step.id}: "${s.slice(0, 60)}"`).toBe(false);
      }
    }
    for (const q of content.quiz) {
      for (const s of [q.q, q.explain, ...q.options]) {
        expect(FORBIDDEN.test(s), `arrow in quiz of ${meta.id}: "${s.slice(0, 60)}"`).toBe(false);
      }
    }
    for (const t of content.proveIt) {
      for (const s of [t.title, t.body, t.expect ?? '']) {
        expect(FORBIDDEN.test(s), `arrow in proveIt of ${meta.id}`).toBe(false);
      }
    }
  });

  it('resolves every manifest-backed panel against the generated manifest', () => {
    for (const step of content.steps) {
      const p = step.panel;
      if (p.kind === 'code') {
        const file = snapshotFile(p.chapter, p.file); // throws loudly if missing
        if (p.region) {
          expect(file.regions[p.region], `region ${p.region} of ${p.file} (${meta.id} ${step.id})`).toBeTruthy();
        }
      }
      if (p.kind === 'app-tree' && meta.id !== 'ch00') {
        expect(chapterSnapshot(p.chapter), `app-tree snapshot ${p.chapter}`).toBeTruthy();
      }
    }
  });

  it('gives every interview callout a question title', () => {
    for (const step of content.steps) {
      for (const b of step.blocks) {
        if (b.kind === 'callout' && b.tone === 'interview') {
          expect(b.title, `interview callout in ${meta.id} step ${step.id} needs title=question`).toBeTruthy();
          expect(b.title!.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it('has a sound quiz, prove-it tasks and exercise', () => {
    expect(content.quiz.length).toBeGreaterThanOrEqual(4);
    for (const q of content.quiz) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(10);
    }
    expect(content.proveIt.length).toBeGreaterThanOrEqual(3);
    if (meta.no > 0) {
      expect(content.exercise, `exercise of ${meta.id}`).toBeTruthy();
      expect(content.exercise!.tasks.length).toBeGreaterThanOrEqual(2);
      expect(content.exercise!.acceptance.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('teaches at least two glossary terms per chapter', () => {
    const terms = content.steps.flatMap((s: StepDef) => s.blocks.filter((b) => b.kind === 'term'));
    expect(terms.length).toBeGreaterThanOrEqual(2);
  });
});
