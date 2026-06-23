import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

type Mode = 'bearer' | 'cookie';
type LineKind = 'req' | 'res' | 'info' | 'err';

interface LogLine {
  kind: LineKind;
  text: string;
}
interface Step {
  line: LogLine;
  apply?: () => void;
}

/**
 * Demo for ch30 — a simulated auth round-trip you can watch step by step.
 * Toggle the carrier (Bearer header vs cookie + withCredentials) and force the
 * access token to expire; calling the API then drives the
 * 401 -> /auth/refresh -> retry sequence visibly. Pure animation over signals,
 * no real network. Timers cleaned in DestroyRef.
 */
@Component({
  selector: 'demo-auth-flow',
  templateUrl: './auth-flow.demo.html',
  styleUrl: './auth-flow.demo.scss',
})
export class AuthFlowDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode = signal<Mode>('bearer');
  protected readonly loggedIn = signal(false);
  protected readonly expired = signal(false);
  protected readonly busy = signal(false);
  protected readonly log = signal<LogLine[]>([]);

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  protected readonly carrier = computed(() =>
    this.mode() === 'bearer'
      ? 'Authorization: Bearer eyJ…'
      : 'Cookie auto-sent (withCredentials)',
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  protected setMode(m: Mode): void {
    if (this.busy()) return;
    this.mode.set(m);
    this.reset();
  }

  protected login(): void {
    const tokenLine: LogLine =
      this.mode() === 'bearer'
        ? { kind: 'res', text: '200 — { accessToken (15m), refreshToken (7d) } in body' }
        : { kind: 'res', text: '200 — Set-Cookie: access=…; HttpOnly; SameSite=None; Secure' };
    this.play([
      { line: { kind: 'req', text: 'POST /api/auth/login  { email, password }' } },
      { line: { kind: 'info', text: 'server verifies password (PBKDF2) + builds claims' } },
      {
        line: tokenLine,
        apply: () => {
          this.loggedIn.set(true);
          this.expired.set(false);
        },
      },
    ]);
  }

  protected callApi(): void {
    if (!this.loggedIn()) {
      this.play([{ line: { kind: 'err', text: 'no session — login first (would 401)' } }]);
      return;
    }
    const get: LogLine = { kind: 'req', text: `GET /api/projects/1/issues   [${this.carrier()}]` };

    if (!this.expired()) {
      this.play([{ line: get }, { line: { kind: 'res', text: '200 — issues page' } }]);
      return;
    }

    // expired access token -> the interceptor's 401 -> refresh -> retry path
    const refreshReq: LogLine =
      this.mode() === 'bearer'
        ? { kind: 'req', text: 'POST /api/auth/refresh  { refreshToken }' }
        : { kind: 'req', text: 'POST /api/auth/refresh   [refresh cookie auto-sent]' };
    this.play([
      { line: get },
      { line: { kind: 'err', text: '401 Unauthorized — access token expired' } },
      { line: { kind: 'info', text: 'interceptor catches 401, then one in-flight refresh (no stampede)' } },
      { line: refreshReq },
      {
        line: { kind: 'res', text: '200 — new access + rotated refresh' },
        apply: () => this.expired.set(false),
      },
      { line: { kind: 'info', text: 'switchMap retries the ORIGINAL request with the new token' } },
      { line: { kind: 'req', text: 'GET /api/projects/1/issues   (retry)' } },
      { line: { kind: 'res', text: '200 — issues page' } },
    ]);
  }

  protected forceExpiry(): void {
    if (!this.loggedIn() || this.busy()) return;
    this.expired.set(true);
    this.push({ kind: 'info', text: 'access token expired — the next call will 401' });
  }

  protected reset(): void {
    if (this.busy()) return;
    this.loggedIn.set(false);
    this.expired.set(false);
    this.log.set([]);
  }

  // ---- animation engine ----
  private play(steps: Step[]): void {
    if (this.busy()) return;
    this.busy.set(true);
    steps.forEach((s, i) => {
      const t = setTimeout(
        () => {
          this.timers.delete(t);
          this.push(s.line);
          s.apply?.();
          if (i === steps.length - 1) this.busy.set(false);
        },
        i * 500 + 150,
      );
      this.timers.add(t);
    });
  }

  private push(line: LogLine): void {
    this.log.update((l) => [...l, line]);
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }
}
