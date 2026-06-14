import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TokenStore } from '../../core/auth/token.store';
import { IssuesStore } from '../../core/state/issues.store';
import { Issue, IssueListQuery, IssueStatus } from '../../core/models/issue.model';
import { TfBadge } from '../../shared/ui/badge/badge';

// שלוש העמודות של הלוח, בסדר זרימת העבודה. התוויות בעברית הן ל-UI בלבד —
// הערך ששוכב ב-issue.status נשאר השם המקורי של ה-enum מהשרת.
const STATUSES: IssueStatus[] = ['Open', 'InProgress', 'Done'];
const STATUS_LABELS: Record<IssueStatus, string> = {
  Open: 'פתוח',
  InProgress: 'בעבודה',
  Done: 'הושלם',
};

// הלוח טוען עמוד אחד גדול ככל שמותר — אין pager בלוח. השרת מגביל pageSize
// ל-100 (Range מפרק 04), ולכן זו התקרה; לוח עם יותר מ-100 issues יזדקק
// לדפדוף או virtual scroll, אבל לנתוני הדמו 100 מציג את כל הפרויקט.
const BOARD_PAGE_SIZE = 100;
/** מרווח ה-rank ההתחלתי בקצה עמודה (תואם את ה-gap של ה-seed בשרת) */
const RANK_GAP = 1024;

interface Column {
  status: IssueStatus;
  label: string;
  issues: Issue[];
}

// #region step-17.11
// הרכיב החכם של הלוח. הוא חולק את אותו IssuesStore עם תצוגת הרשימה (פרק 13),
// אבל מבקש ממנו מיון 'rank' ועמוד אחד גדול, וגוזר ממנו עמודות לפי סטטוס.
// כל DnD — עכבר ומקלדת כאחד — מסתכם בפעולה אחת: store.reorder אופטימי.
@Component({
  selector: 'tf-kanban-board',
  imports: [DragDropModule, TfBadge],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.scss',
})
export class KanbanBoard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(IssuesStore);
  protected readonly tokenStore = inject(TokenStore);

  readonly projectId = input.required({ transform: numberAttribute });

  protected readonly statuses = STATUSES;

  // הלוח מבקש מה-store מיון rank, בלי סינון, בעמוד אחד גדול. אותו חוזה
  // ציבורי של ה-store משרת גם את הרשימה וגם את הלוח — רק ה-query שונה.
  private readonly query = computed<IssueListQuery>(() => ({
    projectId: this.projectId(),
    status: null,
    search: null,
    sort: 'rank',
    page: 1,
    pageSize: BOARD_PAGE_SIZE,
  }));

  constructor() {
    effect(() => this.store.setQuery(this.query()));
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.focusTimer);
      this.store.clearQuery();
    });
  }
  // #endregion

  // #region step-17.12
  // קיבוץ נגזר: כל עמודה היא ה-issues של אותו סטטוס, ממוינים לפי rank.
  // השרת כבר החזיר ממוין, אבל ממיינים שוב מקומית — כי עדכון אופטימי משנה
  // rank במפה בלי לטעון מחדש, וכך הקלף קופץ למיקום הנכון באותו רגע.
  readonly columns = computed<Column[]>(() => {
    const all = this.store.issues();
    return STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      issues: all.filter((i) => i.status === status).sort((a, b) => a.rank - b.rank),
    }));
  });
  // #endregion

  /** הודעת aria-live — קוראי מסך מקריאים כל שינוי שלה */
  protected readonly announcement = signal('');
  /** ה-id של הקלף ש"הורם" במקלדת, או null כשאף אחד לא מורם */
  protected readonly grabbedId = signal<number | null>(null);

  // #region step-17.13
  // הטריק המרכזי של הסידור: rank חדש = נקודת אמצע בין שני השכנים. אין renumber
  // של שורות — רק double אחד משתנה. זו גם המגבלה: אחרי מספיק חצאים רצופים נגמרת
  // הדיוק של double (~52 ביט מנטיסה). LexoRank פותר זאת עם מחרוזות; כאן בוחרים
  // בפשטות ומלמדים את הגבול.
  private midpoint(prev: number | undefined, next: number | undefined): number {
    if (prev == null && next == null) return RANK_GAP; // עמודה ריקה
    if (prev == null) return next! / 2; // ראש העמודה
    if (next == null) return prev + RANK_GAP; // סוף העמודה
    return (prev + next) / 2; // בין שני שכנים
  }
  // #endregion

  // #region step-17.14
  // נקודת המפגש של עכבר ומקלדת: finalArr הוא איך העמודה תיראה *אחרי* ההזזה,
  // כשהקלף שזז כבר נמצא במקומו. ה-rank נגזר מהשכנים שלו שם, וה-reorder
  // האופטימי מצייר → שולח → מתחרט. ההכרזה מתארת את התוצאה לקורא מסך.
  private commitMove(issue: Issue, target: IssueStatus, finalArr: Issue[]): void {
    const pos = finalArr.findIndex((i) => i.id === issue.id);
    const rank = this.midpoint(finalArr[pos - 1]?.rank, finalArr[pos + 1]?.rank);

    // אחרי ה-re-render האופטימי הפוקוס יכול ללכת לאיבוד (מעבר עמודה מוחק DOM) —
    // אם הקלף מורם במקלדת, נחזיר אליו את הפוקוס כדי שאפשר יהיה להמשיך לזוז.
    if (this.grabbedId() === issue.id) this.refocusAfterRender(issue.id);

    void this.store.reorder(issue, target, rank).then((ok) => {
      this.announce(
        ok
          ? `${issue.title}: ${STATUS_LABELS[target]}, ${pos + 1} מתוך ${finalArr.length}`
          : `העברת ${issue.title} נכשלה והוחזרה`,
      );
      if (!ok) this.grabbedId.set(null);
    });
  }
  // #endregion

  // #region step-17.15
  // נתיב העכבר: CDK נותן את עמודת היעד ואת ה-index הסופי. בונים את הרשימה
  // הסופית באותו אופן ש-CDK יצייר אותה (אותה עמודה → moveItemInArray; עמודה
  // אחרת → splice), וממנה commitMove גוזר rank. דרופ ללא תזוזה מתעלמים ממנו.
  protected onDrop(event: CdkDragDrop<IssueStatus>, target: IssueStatus): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const issue = event.item.data as Issue;
    const column = this.columns().find((c) => c.status === target)!;

    let finalArr: Issue[];
    if (event.previousContainer === event.container) {
      finalArr = [...column.issues];
      moveItemInArray(finalArr, event.previousIndex, event.currentIndex);
    } else {
      finalArr = column.issues.filter((i) => i.id !== issue.id);
      finalArr.splice(Math.min(event.currentIndex, finalArr.length), 0, issue);
    }

    this.commitMove(issue, target, finalArr);
  }
  // #endregion

  // #region step-17.16
  // נתיב המקלדת — הדרישה הקשה בקורס. רווח/Enter "מרים" ו"מניח" קלף; כשהוא
  // מורם, החיצים מזיזים אותו (מעלה/מטה בעמודה, שמאל/ימין בין עמודות) ו-Esc
  // מבטל. כל הזזה מכריזה את המיקום החדש דרך אזור ה-aria-live.
  protected onCardKey(event: KeyboardEvent, issue: Issue): void {
    const key = event.key;

    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      if (this.grabbedId() === issue.id) {
        this.grabbedId.set(null);
        this.announce(`${issue.title} הונח`);
      } else {
        this.grabbedId.set(issue.id);
        this.announce(
          `${issue.title} הורם. חיצים מעלה/מטה להזזה בעמודה, שמאל/ימין למעבר עמודה, רווח להנחה, Esc לביטול`,
        );
      }
      return;
    }

    if (key === 'Escape' && this.grabbedId() === issue.id) {
      event.preventDefault();
      this.grabbedId.set(null);
      this.announce(`הזזת ${issue.title} בוטלה`);
      return;
    }

    // החיצים פועלים רק על הקלף המורם — אחרת Tab/חיצים מנווטים כרגיל
    if (this.grabbedId() !== issue.id) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
    event.preventDefault();
    this.moveByKey(issue, key);
  }

  private moveByKey(issue: Issue, key: string): void {
    const cols = this.columns();
    const colIndex = cols.findIndex((c) => c.status === issue.status);
    const column = cols[colIndex];
    const pos = column.issues.findIndex((i) => i.id === issue.id);

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      const targetPos = pos + (key === 'ArrowUp' ? -1 : 1);
      if (targetPos < 0 || targetPos >= column.issues.length) return; // קצה העמודה
      const finalArr = [...column.issues];
      moveItemInArray(finalArr, pos, targetPos);
      this.commitMove(issue, issue.status, finalArr);
      return;
    }

    // RTL: חץ ימינה = העמודה הקודמת, חץ שמאלה = העמודה הבאה
    const targetIndex = colIndex + (key === 'ArrowRight' ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= cols.length) return; // קצה הלוח
    const targetCol = cols[targetIndex];
    const finalArr = [...targetCol.issues, issue]; // נכנס לתחתית עמודת היעד
    this.commitMove(issue, targetCol.status, finalArr);
  }
  // #endregion

  private focusTimer: ReturnType<typeof setTimeout> | undefined;

  private refocusAfterRender(id: number): void {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-issue-id="${id}"]`)
        ?.focus();
    });
  }

  private announce(message: string): void {
    this.announcement.set(message);
  }

  protected priorityClass(issue: Issue): string {
    return `prio--${issue.priority.toLowerCase()}`;
  }
}
