// #region step-16.4
// פקודה = יחידת פעולה אחת שה-palette יכול להציג ולהריץ.
// פיצ'רים רושמים פקודות; ה-palette הוא צרכן טיפש שלא יודע מאיפה הן הגיעו.
export interface Command {
  /** מזהה יציב (לשימוש ב-track ולמניעת כפילויות) */
  id: string;
  /** הטקסט שמוצג ב-palette */
  title: string;
  /** קבוצה לוגית להצגה ולמיון ("ניווט", "תצוגה", "זהות") */
  group: string;
  /** מילים נרדפות לחיפוש fuzzy (למשל "logout" עבור "Sign out") */
  keywords?: string;
  /** תווית קיצור מקלדת להצגה בלבד (לא מבוצעת כאן) */
  hint?: string;
  /** מה הפקודה עושה כשבוחרים אותה */
  run: () => void;
}
// #endregion
