# 02 — Design Language v2 (the token system to implement in Phase 0)

Goal: a **neutral + single-accent**, best-practice-2026 system (Linear/Radix/shadcn lineage) that makes every screen
feel designed, taught as a real multi-dimensional token system. Implemented **additively** so the retrofit doesn't
break existing components.

## The #1 rule that keeps the retrofit safe: ADDITIVE-FIRST

The existing taught-app tokens (in `reference/ch08/client/src/styles/_tokens.scss`) are:
`--bg --sur --sur2 --bdr --txt1 --txt2 --txt3 --ember --teal --danger --rad --rad-sm --sp-1..5 --fs-body --fs-h1 --fs-h2 --fs-small`.
The companion (`src/styles.scss`) has a larger but **differently-named** set (`--txt` not `--txt1`, `--sur3/4`, `--eglow`, …).

**Do NOT rename any existing token.** Instead:
1. Define a proper **primitive ramp** as NEW tokens (`--gray-*`, `--accent-*`, motion, elevation, density).
2. **Remap the existing semantic names onto the ramp** (value-only change). `--bg`, `--sur`, `--txt1` keep their names
   and every component keeps working — they just resolve to better values.
3. Add the genuinely new tokens (elevation, motion, density, focus) and adopt them in NEW work + selective upgrades.

This makes Phase 0 a **value + addition** change with near-zero code ripple. The only files that MUST change are the
token partials; component SCSS changes only where you deliberately adopt a new token (elevation/motion). See the
rename-escape-hatch at the bottom if a rename ever becomes unavoidable.

## Unify the two apps

The taught app and the companion must share the SAME token definitions. They're separate codebases (snapshot vs guide)
so you can't `@use` across them — **copy the canonical block into both**: `reference/ch08/client/src/styles/_tokens.scss`
(taught) and `src/styles.scss` (companion). Keep them identical going forward; note any divergence in the progress log.

## Primitives (define once, in `:root`, dark default)

Use **OKLCH** (best practice: perceptually uniform, easy ramps). Values below are strong starting points — refine in the
browser against real screens; lock final hex/oklch in the progress log.

### Neutral ramp (12 steps, dark)
```
--gray-1:  oklch(0.17 0.01 260);   /* app background        */
--gray-2:  oklch(0.20 0.012 260);  /* raised surface        */
--gray-3:  oklch(0.24 0.014 260);  /* surface 2 / hover      */
--gray-4:  oklch(0.28 0.016 260);  /* surface 3 / active     */
--gray-5:  oklch(0.33 0.018 260);  /* subtle border          */
--gray-6:  oklch(0.39 0.02 260);   /* border                 */
--gray-7:  oklch(0.46 0.022 260);  /* strong border / divider*/
--gray-8:  oklch(0.55 0.022 260);  /* disabled text          */
--gray-9:  oklch(0.64 0.02 260);   /* muted text (txt3)      */
--gray-10: oklch(0.74 0.018 260);  /* secondary text (txt2)  */
--gray-11: oklch(0.86 0.012 260);  /* primary-ish            */
--gray-12: oklch(0.96 0.006 260);  /* highest-contrast text  */
```
Light theme (`[data-theme='light']`) = invert the ramp (gray-1 lightest … gray-12 darkest) keeping the warm-paper hue
(shift hue toward ~85 and raise chroma slightly for the paper feel).

### Single accent (keep "ember" hue, ~55 OKLCH hue / warm orange)
```
--accent:          oklch(0.70 0.16 55);    /* primary actions, focus       */
--accent-strong:   oklch(0.64 0.17 55);    /* hover/pressed                */
--accent-subtle:   oklch(0.70 0.16 55 / 0.14); /* tinted backgrounds       */
--accent-contrast: oklch(0.18 0.03 55);    /* text/icon ON accent          */
```
Keep `--ember` as an **alias** of `--accent` (so existing components don't break): `--ember: var(--accent);`.

### Status / semantic colors (NOT brand accents — keep for badges)
Keep `--teal --danger` and add `--success --warning --info` as OKLCH. `--teal` stays defined (alias to `--info` or keep
its hue) so existing usages survive; the *brand* is single-accent, but status chips legitimately use multiple hues.

### Remap existing semantics onto the ramp (value-only)
```
--bg:   var(--gray-1);
--sur:  var(--gray-2);
--sur2: var(--gray-3);
--sur3: var(--gray-4);          /* add if companion needs it */
--bdr:  var(--gray-6);
--bdr2: var(--gray-7);
--txt1: var(--gray-12);  --txt: var(--gray-12);   /* companion uses --txt */
--txt2: var(--gray-10);
--txt3: var(--gray-9);
```

### Elevation (light, layered — not heavy drop shadows)
```
--shadow-1: 0 1px 2px oklch(0 0 0 / 0.30), 0 1px 1px oklch(0 0 0 / 0.20);
--shadow-2: 0 4px 12px oklch(0 0 0 / 0.35), 0 2px 4px oklch(0 0 0 / 0.20);
--shadow-3: 0 12px 32px oklch(0 0 0 / 0.45), 0 4px 8px oklch(0 0 0 / 0.25);
--ring:     0 0 0 2px var(--bg), 0 0 0 4px var(--accent);   /* focus ring */
```

### Motion (the missing dimension — this is what makes it feel "Linear")
```
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--dur-1: 120ms;  --dur-2: 160ms;  --dur-3: 240ms;  --dur-4: 360ms;
```
All motion must respect the existing `@media (prefers-reduced-motion: reduce)` block.

### Type scale (fluid; keep existing names, add a fuller scale)
```
--fs-xs:   clamp(11px, 10.6px + 0.12vw, 12px);
--fs-sm:   clamp(12px, 11.5px + 0.15vw, 13px);   /* == old --fs-small */
--fs-base: clamp(14px, 13.2px + 0.25vw, 16px);   /* == old --fs-body  */
--fs-lg:   clamp(16px, 15px + 0.4vw, 18px);
--fs-xl:   clamp(18px, 16px + 0.6vw, 22px);       /* == old --fs-h2-ish*/
--fs-2xl:  clamp(22px, 18px + 1.1vw, 30px);       /* == old --fs-h1    */
--lh-tight: 1.2;  --lh-snug: 1.4;  --lh-normal: 1.6;
--fw-regular: 400; --fw-medium: 550; --fw-semibold: 650; --fw-bold: 750;
--tracking-tight: -0.01em;
```
Keep `--fs-small/body/h1/h2` as aliases of the new names.

### Radius & density
```
--rad-sm: 8px;  --rad: 12px;  --rad-lg: 16px;  --rad-full: 999px;   /* keep --rad/--rad-sm */
--control-h: 36px;  --control-h-sm: 28px;
/* density modes via attribute on <html> or app root */
[data-density='compact'] { --control-h: 30px; --control-h-sm: 24px; --sp-3: 10px; --sp-4: 16px; }
```

## What "industry-standard / pixel-perfect" means in practice (teach these)

- **One accent.** Color carries meaning, not decoration. Neutrals do the heavy lifting; the accent marks the single
  primary action / focus.
- **Optical spacing & alignment**, a consistent spacing scale (`--sp-*`), and a real type scale — no magic numbers.
- **Elevation as a system** (3 steps), not random box-shadows.
- **Motion as a system** (durations + easings as tokens), short and purposeful; everything reduced-motion safe.
- **Contrast / a11y**: text on surface ≥ 4.5:1 (the ramp is built for this); visible focus ring everywhere.
- **States are first-class**: hover/active/focus/disabled/loading/empty/error for every interactive element.

## Theming surface (what the design-system chapter now teaches)

`@layer tokens` holds primitives; `[data-theme='light']` overrides; optional `[data-density]`; runtime switch via the
existing `ThemeService` (taught) / theme signal (companion). Code blocks stay dark in both themes (existing rule).

## Rename escape-hatch (only if truly unavoidable)

1. grep the token across `reference/**` AND `src/**` AND the companion: `rg -- '--old-name'`.
2. Global replace in one pass (overlays + guide). 3. `pnpm gen:manifest` + all gates. 4. Re-run the 375px/RTL sweep.
5. Record the rename in `06-PROGRESS-LOG.md`. Prefer adding an alias over renaming whenever possible.
