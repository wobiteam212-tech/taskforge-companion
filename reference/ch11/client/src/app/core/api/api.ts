// כתובת ה-API במקום אחד. בפרודקשן זה יגיע מהגדרת סביבה או reverse proxy —
// בפיתוח, השרת חי על 5080 והקליינט על 4500, ו-CORS (צד השרת) מתיר את הפער.
export const API_BASE = 'http://localhost:5080/api';
