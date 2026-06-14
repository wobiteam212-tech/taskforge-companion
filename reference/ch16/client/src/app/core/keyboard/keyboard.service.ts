import { DestroyRef, Injectable, inject } from '@angular/core';

// #region step-16.3
// שכבת מקלדת גלובלית אחת. רכיבים רושמים צירוף -> handler במקום שכל
// רכיב יוסיף listener משלו. "mod" = Cmd ב-macOS, Ctrl במקום אחר.
// הקלדה בשדה טקסט לא חוטפת קיצורים — אלא אם הצירוף כולל mod, כך ש-Cmd+K
// עובד גם בתוך input.
type Handler = () => void;

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private readonly bindings = new Map<string, Handler>();

  constructor() {
    if (typeof document === 'undefined') return; // בטוח ל-SSR/jsdom
    document.addEventListener('keydown', this.onKeydown);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', this.onKeydown));
  }

  /** combo בפורמט 'mod+k', 'shift+/' וכו' (אותיות קטנות) */
  bind(combo: string, handler: Handler): void {
    this.bindings.set(combo.toLowerCase(), handler);
  }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    const combo = comboOf(event);
    const handler = this.bindings.get(combo);
    if (!handler) return;

    const hasMod = event.metaKey || event.ctrlKey;
    if (isTyping(event.target) && !hasMod) return;

    event.preventDefault();
    handler();
  };
}

function comboOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}
// #endregion
