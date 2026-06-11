import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { TokenStore } from './core/auth/token.store';
import { ThemeService } from './core/state/theme';
import { LoginDialog } from './features/auth/login-dialog';
import { TfButton } from './shared/ui/button/button';
import { ToastContainer } from './shared/ui/toast/toast-container';

// #region step-6.10
@Component({
  selector: 'app-root',
  // #region step-7.11
  // השלד עדיין לא מכיר פיצ'רים של תוכן — אבל זהות היא חוצת-אפליקציה,
  // ולכן ה-login נטען כאן, לצד ה-theme וה-toasts.
  imports: [RouterOutlet, RouterLink, LoginDialog, TfButton, ToastContainer],
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
}
// #endregion
