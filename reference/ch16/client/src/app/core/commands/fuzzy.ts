// #region step-16.6
// התאמת fuzzy בעבודת יד: כל תווי ה-query חייבים להופיע ב-text לפי הסדר.
// בונוסים על התאמה בתחילת מילה ועל רצף — כדי שתוצאות "טבעיות" יעלו למעלה.
// אין כאן ספרייה: כ-50 שורות מלמדות בדיוק איך scoring כזה עובד.
interface Ranked<T> {
  item: T;
  score: number;
}

/** מחזיר ציון; ‎-1 אם ולו תו אחד מה-query לא נמצא לפי הסדר. */
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  let score = 0;
  let from = 0;
  let prevMatch = -2;

  for (const ch of q) {
    const at = t.indexOf(ch, from);
    if (at === -1) return -1;

    // בונוס: התאמה בתחילת מילה (אחרי רווח/מקף/לוכסן) או בתחילת המחרוזת
    const atBoundary = at === 0 || /[\s\-/_]/.test(t[at - 1]);
    score += atBoundary ? 8 : 1;

    // בונוס רצף: תווים סמוכים שווים יותר מתווים מפוזרים
    if (at === prevMatch + 1) score += 3;

    prevMatch = at;
    from = at + 1;
  }

  return score;
}

/** מסנן לפי התאמה וממיין מהציון הגבוה לנמוך. query ריק = הכול, כסדרו. */
export function fuzzyRank<T>(items: readonly T[], query: string, key: (item: T) => string): T[] {
  if (!query.trim()) return [...items];

  const ranked: Ranked<T>[] = [];
  for (const item of items) {
    const score = fuzzyScore(key(item), query);
    if (score >= 0) ranked.push({ item, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.map((r) => r.item);
}
// #endregion
