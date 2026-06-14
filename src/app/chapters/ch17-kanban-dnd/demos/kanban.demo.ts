import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

type ColumnId = 'todo' | 'doing' | 'done';

interface DemoCard {
  id: number;
  title: string;
  col: ColumnId;
  rank: number;
}

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'לעשות' },
  { id: 'doing', label: 'בעבודה' },
  { id: 'done', label: 'הושלם' },
];

const SEED: DemoCard[] = [
  { id: 1, title: 'עיצוב מסך הבית', col: 'todo', rank: 1024 },
  { id: 2, title: 'תיקון לולאת הניתוב', col: 'todo', rank: 2048 },
  { id: 3, title: 'בדיקת טופס הקשר', col: 'doing', rank: 1024 },
  { id: 4, title: 'אופטימיזציה לתמונות', col: 'done', rank: 1024 },
];

/**
 * דמו: מודל ה-Kanban של פרק 17 בלי שרת. אותו רעיון בדיוק — סידור אופטימי
 * עם rank של נקודת-אמצע, נתיב מקלדת (רווח להרים, חיצים להזיז, Esc לבטל),
 * וגרירת עכבר native. מתג "שבור את השרת" מדגים את ה-rollback: הקלף זז מיד,
 * וכשה"שמירה" נכשלת הוא קופץ בחזרה. כל הטיימרים מנוקים ב-DestroyRef.
 */
@Component({
  selector: 'demo-kanban',
  templateUrl: './kanban.demo.html',
  styleUrl: './kanban.demo.scss',
})
export class KanbanDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns = COLUMNS;
  protected readonly cards = signal<DemoCard[]>(structuredClone(SEED));
  protected readonly breakServer = signal(false);
  protected readonly grabbedId = signal<number | null>(null);
  protected readonly savingId = signal<number | null>(null);
  protected readonly log = signal<string[]>([]);

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    });
  }

  protected cardsOf(col: ColumnId): DemoCard[] {
    return this.cards()
      .filter((c) => c.col === col)
      .sort((a, b) => a.rank - b.rank);
  }

  protected readonly announcement = computed(() => this.log()[0] ?? '');

  // נקודת אמצע בין שכנים — אותו טריק כמו בפרק
  private midpoint(prev: number | undefined, next: number | undefined): number {
    if (prev == null && next == null) return 1024;
    if (prev == null) return next! / 2;
    if (next == null) return prev + 1024;
    return (prev + next) / 2;
  }

  // הליבה: סידור אופטימי + rollback מדומה
  private move(card: DemoCard, toCol: ColumnId, finalArr: DemoCard[]): void {
    const before = structuredClone(this.cards());
    const pos = finalArr.findIndex((c) => c.id === card.id);
    const rank = this.midpoint(finalArr[pos - 1]?.rank, finalArr[pos + 1]?.rank);

    // צייר מיד
    this.cards.update((list) =>
      list.map((c) => (c.id === card.id ? { ...c, col: toCol, rank } : c)),
    );
    this.savingId.set(card.id);
    this.pushLog(`הוזז "${card.title}" → ${this.labelOf(toCol)} (rank ${Math.round(rank)})`);

    // "שלח לשרת"
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.savingId.set(null);
      if (this.breakServer()) {
        this.cards.set(before);
        this.pushLog(`✗ השמירה נכשלה — "${card.title}" הוחזר`);
        this.grabbedId.set(null);
      } else {
        this.pushLog(`✓ נשמר "${card.title}"`);
      }
    }, 600);
    this.timers.add(t);
  }

  // ----- נתיב מקלדת -----
  protected onKey(event: KeyboardEvent, card: DemoCard): void {
    const key = event.key;
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      if (this.grabbedId() === card.id) {
        this.grabbedId.set(null);
        this.pushLog(`הונח "${card.title}"`);
      } else {
        this.grabbedId.set(card.id);
        this.pushLog(`הורם "${card.title}" — חיצים להזזה, רווח להנחה`);
      }
      return;
    }
    if (key === 'Escape' && this.grabbedId() === card.id) {
      event.preventDefault();
      this.grabbedId.set(null);
      this.pushLog(`בוטל`);
      return;
    }
    if (this.grabbedId() !== card.id) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
    event.preventDefault();

    const colIndex = COLUMNS.findIndex((c) => c.id === card.col);
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      const list = this.cardsOf(card.col);
      const pos = list.findIndex((c) => c.id === card.id);
      const target = pos + (key === 'ArrowUp' ? -1 : 1);
      if (target < 0 || target >= list.length) return;
      const finalArr = [...list];
      finalArr.splice(pos, 1);
      finalArr.splice(target, 0, card);
      this.move(card, card.col, finalArr);
    } else {
      const targetIndex = colIndex + (key === 'ArrowRight' ? -1 : 1);
      if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;
      const toCol = COLUMNS[targetIndex].id;
      this.move(card, toCol, [...this.cardsOf(toCol), card]);
    }
  }

  // ----- נתיב עכבר native -----
  protected onDragStart(event: DragEvent, card: DemoCard): void {
    event.dataTransfer?.setData('text/plain', String(card.id));
  }

  protected onDrop(event: DragEvent, toCol: ColumnId): void {
    event.preventDefault();
    const id = Number(event.dataTransfer?.getData('text/plain'));
    const card = this.cards().find((c) => c.id === id);
    if (!card) return;
    const finalArr = [...this.cardsOf(toCol).filter((c) => c.id !== id), card];
    this.move(card, toCol, finalArr);
  }

  protected allow(event: DragEvent): void {
    event.preventDefault();
  }

  protected reset(): void {
    this.cards.set(structuredClone(SEED));
    this.grabbedId.set(null);
    this.savingId.set(null);
    this.pushLog('אופס');
  }

  private labelOf(col: ColumnId): string {
    return COLUMNS.find((c) => c.id === col)!.label;
  }

  private pushLog(line: string): void {
    this.log.update((l) => [line, ...l].slice(0, 6));
  }
}
