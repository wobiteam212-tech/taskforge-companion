// כתובת ה-API במקום אחד. בפרודקשן זה יגיע מהגדרת סביבה או reverse proxy —
// בפיתוח, השרת חי על 5080 והקליינט על 4500, ו-CORS (צד השרת) מתיר את הפער.
export const API_BASE = 'http://localhost:5080/api';

// #region step-24.10
// פרק 24: ה-hub לא יושב תחת /api אלא תחת /hubs. כתובת אחת, כמו API_BASE,
// כך שיש מקור-אמת יחיד גם ל-WebSocket.
export const HUB_BASE = 'http://localhost:5080/hubs';
// #endregion
