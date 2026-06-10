import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-http';
// `markup` (html) and `css` ship with prism core.

import type { SourceLang } from '../registry/chapter.types';

const GRAMMAR: Record<SourceLang, string> = {
  typescript: 'typescript',
  html: 'markup',
  scss: 'scss',
  css: 'css',
  json: 'json',
  bash: 'bash',
  csharp: 'csharp',
  http: 'http',
  sql: 'sql',
  yaml: 'yaml',
};

/** Detect a SourceLang from a file path. */
export function langFromFile(file: string): SourceLang {
  if (file.endsWith('.cs') || file.endsWith('.csproj')) return 'csharp';
  if (file.endsWith('.http')) return 'http';
  if (file.endsWith('.ts')) return 'typescript';
  if (file.endsWith('.html')) return 'html';
  if (file.endsWith('.scss')) return 'scss';
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.json')) return 'json';
  if (file.endsWith('.sql')) return 'sql';
  if (file.endsWith('.yml') || file.endsWith('.yaml')) return 'yaml';
  return 'bash';
}

/** Return Prism-highlighted HTML for a code string. Safe to bind via innerHTML. */
export function highlight(code: string, lang: SourceLang): string {
  const name = GRAMMAR[lang];
  const grammar = Prism.languages[name];
  if (!grammar) return escapeHtml(code);
  return Prism.highlight(code, grammar, name);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
