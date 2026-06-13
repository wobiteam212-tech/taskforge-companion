# Spec — ch19: Rich Issue Detail + Activity

**Type:** new forward chapter. **Spine piece #4:** custom form controls + optimistic threads + undo/redo.
**Trim:** this is the FIRST to drop if scope tightens (ch14 detail already works). If kept, it deepens ch14 signal forms.

## Goal

Upgrade the issue detail into a rich workspace: markdown/rich-text editor for description + comments, @mentions,
attachments, an activity timeline, and a View Transition animating board→detail.

## Backend (`reference/ch19/server/...`) — grow to match

- **Attachments**: entity `Attachment { Id, IssueId, FileName, ContentType, SizeBytes, StoragePath/Bytes, CreatedAtUtc, UploadedByUserId }`.
  Upload endpoint `POST /api/issues/{id}/attachments` (multipart; store on disk under a dev folder or as a BLOB —
  teach the trade-off; keep dev-simple). List `GET /api/issues/{id}/attachments`; download `GET /api/attachments/{id}`.
  Resource-based authz. **EF migration** (new table) → generate in `.build`, copy back.
- **Mentions lookup**: `GET /api/projects/{id}/members?q=` already-ish exists via members; ensure a lightweight
  member search for the @mention autocomplete (reuse `project-members` data or add a thin endpoint).
- **Activity**: surface the ch18 activity-log entries on the issue (filter by issueId) — `GET /api/issues/{id}/activity`.
  (If ch18 was trimmed, introduce the activity entity here instead.)
- `milestones.json` += ch19 dotnet + ng.

## Frontend (`reference/ch19/client/...`)

- `shared/ui/markdown-editor/` — a custom form control implementing `[formField]` (deepens ch14 signal-forms custom
  controls): a textarea-based markdown editor with a preview toggle (hand-rolled minimal markdown→HTML, sanitized) and
  an **@mention autocomplete** popover (anchor positioning). This is spine #4's custom-control lesson.
- `features/issues/issue-detail.*` — replace plain description/comment textareas with the markdown editor; render
  comments as markdown; add an **activity timeline** column; add **attachments** (upload, list, download, progress).
- Optimistic comments with **undo/redo** (the optimistic util from ch17 + a small undo stack) — post comment optimistically,
  allow undo before the server confirms; rollback on failure.
- **View Transitions**: animate the issue title board→detail (ch14 already sets `view-transition-name`; wire
  `withViewTransitions()` in the router and verify the shared-element transition).
- `milestones.json` ng entry.

## Architecture

Custom form controls integrated with signal forms; optimistic threads + a reusable undo/redo stack (spine #4). Keep
`IssueDetailStore` public surface stable; extend, don't break.

## CSS techniques

Anchor-positioned mention popover, View Transitions API (shared element), two-column detail layout (subgrid/container
queries), markdown content styling, upload progress + drag-to-attach affordance, reduced-motion fallbacks.

## Live demo

A mention-autocomplete + optimistic-comment demo: type `@`, pick a member, post a comment optimistically with an Undo
toast, "break server" → rollback. Markdown preview toggle. Timers cleaned. (`@` shown as text in any teaching label → `&#64;`.)

## Teaching outline

~18 steps: custom form control contract, markdown rendering + sanitization (XSS gotcha — interview), @mention
autocomplete + anchor positioning, attachments upload (multipart, content-type, size limits, storage trade-offs),
activity timeline, optimistic threads + undo/redo, View Transitions shared-element. Quiz ≥6, proveIt ≥4 (post comment,
@mention, upload file, board→detail transition), exercise (add comment editing or reactions), terms ≥6.

## Verification

- Snapshot compiles (dotnet incl. migration + ng). Gates green.
- Two-server smoke: markdown renders (and is sanitized — try an injection), @mention works, attachment upload+download
  works, activity shows, optimistic comment + undo + rollback work, View Transition animates, 375px ok, reduced-motion ok.

## Delegation prompt

Standard template + verified facts: attachment/activity/mention DTO shapes + examples, the custom-control signature,
the sanitization approach actually used, the demo behavior, the verified View-Transition behavior.

## Done when

Gates + smoke + review + commit + progress log. (Trim candidate #1 — if dropped, move undo/redo into ch20.)
