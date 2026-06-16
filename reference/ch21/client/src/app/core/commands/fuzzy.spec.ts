import { describe, expect, it } from 'vitest';
import { fuzzyRank, fuzzyScore } from './fuzzy';

// #region step-21.6
// מבחני הדירוג: scoring הוא לוגיקה טהורה עם כללים (גבול-מילה, רצף) — בדיוק סוג
// הקוד שמבחני יחידה שומרים מפני רגרסיה כשמשנים את הנוסחה.
describe('fuzzyScore', () => {
  it('returns -1 when a query char is missing or out of order', () => {
    expect(fuzzyScore('kanban', 'xyz')).toBe(-1);
    expect(fuzzyScore('kanban', 'nk')).toBe(-1); // הסדר חשוב: n לפני k לא קיים
  });

  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('anything', '')).toBe(0);
  });

  it('scores a word-boundary, consecutive match higher than a scattered one', () => {
    const boundary = fuzzyScore('dark mode', 'dark'); // d בתחילת מילה + רצף
    const scattered = fuzzyScore('do a quick reset', 'dark'); // אותם תווים, מפוזרים
    expect(boundary).toBeGreaterThan(scattered);
  });
});

describe('fuzzyRank', () => {
  it('keeps only matches and sorts by score, best first', () => {
    const items = ['Open the board', 'Toggle dark mode', 'Delete project'];
    const ranked = fuzzyRank(items, 'dark', (x) => x);
    expect(ranked[0]).toBe('Toggle dark mode');
    expect(ranked).not.toContain('Open the board');
  });

  it('returns everything unchanged for an empty query', () => {
    const items = ['a', 'b', 'c'];
    expect(fuzzyRank(items, '   ', (x) => x)).toEqual(items);
  });
});
// #endregion
