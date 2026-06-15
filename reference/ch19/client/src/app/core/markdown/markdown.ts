// #region step-19.12
// Markdown מינימלי ובטוח. הכלל הזהב: בורחים מ-HTML *קודם*, ורק אז מוסיפים
// תגיות בטוחות. כך טקסט כמו "<script>alert(1)</script>" שמישהו מדביק בתגובה
// הופך לטקסט מוצג, לא לקוד שרץ — הגנת ה-XSS היא בסדר הפעולות, לא בסינון בדיעבד.

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPE[ch]);
}

// רק סכימות בטוחות לקישורים — חוסם javascript:, data:, וכו'.
// ה-url כבר עבר escape, ולכן בודקים את התחילית בלבד.
function isSafeUrl(url: string): boolean {
  return /^(https?:\/\/|\/)/i.test(url);
}

/**
 * ממיר Markdown מצומצם ל-HTML בטוח: `code`, **bold**, *italic*,
 * [text](url) (סכימות בטוחות בלבד), ‎@mention, ושבירת שורות.
 * הקלט עובר escape מלא לפני כל טרנספורם — מה שלא בתבנית נשאר טקסט.
 */
export function renderMarkdown(source: string): string {
  let html = escapeHtml(source);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, url: string) =>
    isSafeUrl(url) ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>` : text,
  );

  // ‏@mention — הוזכר חבר. ה-‎@ נשאר טקסט; רק עוטפים אותו לעיצוב.
  html = html.replace(/(^|\s)@([\w.-]+)/g, '$1<span class="mention">@$2</span>');

  html = html.replace(/\n/g, '<br>');

  return html;
}
// #endregion
