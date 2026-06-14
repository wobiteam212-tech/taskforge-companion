import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { TokenStore } from './core/auth/token.store';
import { ThemeService } from './core/state/theme';
import { CommandRegistry } from './core/commands/command-registry';
import { KeyboardService } from './core/keyboard/keyboard.service';
import { LoginDialog } from './features/auth/login-dialog';
import { CommandPalette } from './features/command-palette/command-palette';
import { PaletteService } from './features/command-palette/palette.service';
import { TfButton } from './shared/ui/button/button';
import { ToastContainer } from './shared/ui/toast/toast-container';

// #region step-6.10
@Component({
  selector: 'app-root',
  // #region step-7.11
  // השלד עדיין לא מכיר פיצ'רים של תוכן — אבל זהות היא חוצת-אפליקציה,
  // ולכן ה-login נטען כאן, לצד ה-theme וה-toasts.
  // #region step-16.10b
  imports: [RouterOutlet, RouterLink, LoginDialog, TfButton, ToastContainer, CommandPalette],
  // #endregion
  // #endregion
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly themeSvc = inject(ThemeService);
  protected readonly tokenStore = inject(TokenStore);
  private readonly auth = inject(AuthService);

  // signal = ערך + הודעה לכל מי שתלוי בו כשהוא משתנה.
  // ב-zoneless זו הדרך היחידה שהתבנית יודעת להתעדכן.
  protected readonly title = signal('TaskForge');

  protected readonly tagline = computed(() => `${this.title()} — issues, forged by hand`);

  // #region step-11.14
  protected readonly loginOpen = signal(false);

  protected logout(): void {
    this.auth.logout();
  }
  // #endregion

  // #region step-16.10
  // ה-shell מחבר את שלוש החתיכות: keyboard (Cmd+K פותח), palette (מצב),
  // ו-registry (הפקודות הגלובליות). פיצ'רים עתידיים פשוט יקראו register()
  // עם פקודות משלהם — בלי לגעת כאן.
  protected readonly palette = inject(PaletteService);
  private readonly keyboard = inject(KeyboardService);
  private readonly registry = inject(CommandRegistry);
  private readonly router = inject(Router);

  constructor() {
    this.keyboard.bind('mod+k', () => this.palette.toggle());

    this.registry.register(
      {
        id: 'nav.projects',
        title: 'מעבר לכל הפרויקטים',
        group: 'Navigation',
        keywords: 'home projects list',
        hint: 'g p',
        run: () => void this.router.navigate(['/']),
      },
      {
        id: 'view.theme',
        title: 'החלפת מצב כהה / בהיר',
        group: 'View',
        keywords: 'theme dark light mode',
        run: () => this.themeSvc.toggle(),
      },
      {
        id: 'auth.signin',
        title: 'התחברות',
        group: 'Identity',
        keywords: 'sign in login',
        run: () => this.loginOpen.set(true),
      },
      {
        id: 'auth.signout',
        title: 'התנתקות',
        group: 'Identity',
        keywords: 'sign out logout',
        run: () => this.logout(),
      },
    );
  }
  // #endregion
}
// #endregion
