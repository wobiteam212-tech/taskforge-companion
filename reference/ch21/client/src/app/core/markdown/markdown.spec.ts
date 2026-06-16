import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

// #region step-21.5
// מבחני יחידה טהורים לפונקציה טהורה: קלט מחרוזת, פלט מחרוזת — אין DOM, אין שרת.
// הבדיקה הקריטית היא ה-XSS: escape-first הוא ההגנה, וכאן מוכיחים אותה.
describe('renderMarkdown', () => {
  it('escapes a pasted <script> instead of executing it', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('renders **bold**, `code` and *italic* as safe tags', () => {
    expect(renderMarkdown('**b**')).toContain('<strong>b</strong>');
    expect(renderMarkdown('`c`')).toContain('<code>c</code>');
    expect(renderMarkdown('*i*')).toContain('<em>i</em>');
  });

  it('wraps @mentions in a span', () => {
    expect(renderMarkdown('hi @maya')).toContain('<span class="mention">@maya</span>');
  });

  it('linkifies only safe URL schemes', () => {
    expect(renderMarkdown('[t](https://a.b)')).toContain('<a href="https://a.b"');
    // javascript: is rejected — the link text survives, the href does not
    const evil = renderMarkdown('[t](javascript:alert(1))');
    expect(evil).not.toContain('<a ');
    expect(evil).toContain('t');
  });

  it('turns newlines into <br>', () => {
    expect(renderMarkdown('a\nb')).toBe('a<br>b');
  });
});
// #endregion
