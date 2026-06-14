import { Signal, WritableSignal, computed, linkedSignal } from '@angular/core';

// #region step-17.6
// spine piece #2: בסיס גנרי לאוסף ישויות בזיכרון. בלב שלו linkedSignal
// (פרק 13) שמומם לאוסף שלם: בכל פעם שה-source (אמת-השרת) מתחדש, המפה
// מתאפסת לאמת החדשה — ובין תשובות מותר לערוך אותה מקומית (patch/upsert/remove)
// לטובת עדכון אופטימי. כל store של אוסף יושב על זה במקום לשכפל ניהול-מצב.
// המפתח הוא id; ‏Map שומר על סדר ההכנסה, ולכן סדר השרת נשמר.
export class EntityStore<T extends { id: number }> {
  private readonly entities: WritableSignal<Map<number, T>>;

  /** source = הפונקציה שמספקת את אמת-השרת; היא נדגמת ריאקטיבית */
  constructor(source: () => readonly T[]) {
    this.entities = linkedSignal(() => new Map(source().map((e) => [e.id, e])));
  }

  /** הרשימה הנגזרת, בסדר ההכנסה */
  readonly all: Signal<T[]> = computed(() => [...this.entities().values()]);

  byId(id: number): T | undefined {
    return this.entities().get(id);
  }

  /** עריכה ממוקדת של ישות אחת — לא נוגעים בשאר המפה */
  patch(id: number, change: Partial<T>): void {
    const current = this.entities().get(id);
    if (!current) return;
    this.entities.update((m) => new Map(m).set(id, { ...current, ...change }));
  }

  upsert(entity: T): void {
    this.entities.update((m) => new Map(m).set(entity.id, entity));
  }

  remove(id: number): void {
    this.entities.update((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }

  /** צילום מצב לפני פעולה אופטימית, ושחזור אם היא נכשלת */
  snapshot(): Map<number, T> {
    return this.entities();
  }

  restore(snapshot: Map<number, T>): void {
    this.entities.set(snapshot);
  }
}
// #endregion

// #region step-17.7
// optimistic: "צייר קודם, שאל אחר כך" כפונקציה אחת לשימוש חוזר. apply משנה
// את ה-UI מיד; persist שולח לשרת; כישלון → rollback מחזיר את המצב הקודם
// (ה-toast כבר הוצג ע"י ה-interceptor מפרק 11). מחזיר true בהצלחה, false
// בכישלון — כך הקורא יכול להגיב (למשל reload ליישור הדף מול האמת).
export async function optimistic(
  apply: () => void,
  persist: () => Promise<unknown>,
  rollback: () => void,
): Promise<boolean> {
  apply();
  try {
    await persist();
    return true;
  } catch {
    rollback();
    return false;
  }
}
// #endregion
