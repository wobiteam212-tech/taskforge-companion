// #region step-7.4
// המראה של server/TaskForge.Core/Common/PagedResult.cs על הקו.
// שימו לב: TotalPages הוא get-only property ב-C# — אבל System.Text.Json
// מסריאלייז גם properties כאלה, ולכן הוא חלק מהחוזה שהקליינט רואה.
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
// #endregion
