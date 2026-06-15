// #region step-19.13
// המראה של AttachmentResponse על הקו — מטא-דאטה בלבד, בלי ה-bytes.
// ההורדה היא GET /api/attachments/{id} שמחזיר את הקובץ עצמו.
export interface Attachment {
  id: number;
  issueId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAtUtc: string;
}
// #endregion
