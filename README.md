# TaskForge Companion — מדריך פולסטאק אינטראקטיבי

מדריך (Angular v22, zoneless) שמלמד לבנות ביד את **TaskForge** — מנהל issues פולסטאק עם
**.NET 10 Minimal API + Angular v22** — פרק אחרי פרק, עם דמואים חיים, מקור אמיתי בתוך הדפדפן,
והסבר דו-לשוני.

**אתר חי (פתחו מהטלפון):** https://wobiteam212-tech.github.io/taskforge-companion/

## מה יש כאן

27 פרקים, 7 גלים (ch00–ch26):

- **גל 0 — Setup** · **גל 1 — Backend Core** (.NET 10 Minimal APIs, EF Core + SQLite, JWT ביד)
- **גל 2 — Frontend Foundation** (Angular zoneless, signals, design system, routing, HTTP + stores)
- **גל 3 — Features** (פרויקטים, לוח issues, תגובות + Signal Forms)
- **גל 4 — Craft & Polish** (CSS מודרני, Cmd-K palette, Kanban DnD, dashboard, issue עשיר, `@ngrx/signals`)
- **גל 5 — Quality** (xUnit + vitest, ביצועים ונגישות)
- **גל 6 — Production** (OutputCaching + rate-limiting + secrets, SignalR בזמן אמת, Docker + nginx + CI, וקפסטון)

המדריך הוא אפליקציה סטטית לחלוטין — הדמואים הם סימולציות צד-לקוח, וקבצי המקור של כל פרק
ארוזים פנימה. אין צורך ב-backend כדי להריץ אותו.

## הרצה מקומית

```bash
pnpm install
pnpm start        # ng serve על http://localhost:4400
```

גייטים (אותם אלה שרצים ב-CI):

```bash
pnpm gen:manifest      # מייצר את ה-manifest מקבצי reference/
pnpm verify:coverage   # כל קובץ snapshot נלמד/מסויר בתוכן
pnpm test              # vitest (content-rules)
pnpm build             # בניית הסטטי
pnpm verify:snapshots  # בונה ובודק כל snapshot של כל פרק (dotnet + ng)
```

## פריסה

`.github/workflows/deploy.yml` בונה את המדריך ופורס אותו ל-GitHub Pages בכל push ל-`main`.
