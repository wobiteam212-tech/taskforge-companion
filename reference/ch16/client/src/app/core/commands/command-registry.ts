import { Injectable, signal } from '@angular/core';
import { Command } from './command.model';

// #region step-16.5
// ה-command bus: מקור אמת אחד לכל הפקודות. פיצ'רים קוראים register();
// ה-palette קורא commands(). אף צד לא מכיר את השני ישירות — בדיוק כמו
// event bus, אבל declarative וטיפוסי. זו אבן הפינה הראשונה של ארכיטקטורת
// ה-spine שתחזור בפרקים 17–20.
@Injectable({ providedIn: 'root' })
export class CommandRegistry {
  private readonly _commands = signal<readonly Command[]>([]);

  /** ציבורי-לקריאה בלבד: ה-palette צורך, לא משנה */
  readonly commands = this._commands.asReadonly();

  register(...commands: Command[]): void {
    this._commands.update((list) => [...list, ...commands]);
  }
}
// #endregion
