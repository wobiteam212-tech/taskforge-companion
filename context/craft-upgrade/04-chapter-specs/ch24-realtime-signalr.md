# Spec — ch24: Realtime with SignalR (BUILT — `431ed99` backend, `53eaf78` client, `65e12b6` content)

**Status:** BUILT + runtime-proven (real two-client SignalR smoke). Wave 6, chapter 2 of 4. Scope confirmed w/ Oleg
(AskUserQuestion) = issue-lifecycle + comments push, echo-skip via connection id; defaults = query-string JWT hub auth,
full-entity payload, `@microsoft/signalr` dep. OPEN DECISIONS resolved per the proposal (presence + live-stats DEFERRED).
The `06-PROGRESS-LOG.md` top entries are the authoritative record of what was built + the gotchas.

## Goal

Make the board **live**: when one member creates / moves / updates / deletes an issue (or adds a comment), every other
member viewing that project sees it appear **without refreshing**. Cash in the seam that ch23 already revealed — the
write handlers (`CreateIssue` / `UpdateIssue` / `ReorderIssue` / `DeleteIssue` / comment-add) are the exact same points
that evict the OutputCache; they become the broadcast points too. Teach realtime as a new transport seam layered onto the
app we already have, not a rewrite.

## OPEN DECISIONS (confirm with Oleg)

1. **Which events broadcast** (proposal = the issue lifecycle + comments): `IssueCreated`, `IssueUpdated`, `IssueMoved`
   (reorder/status), `IssueDeleted`, `CommentAdded`. All scoped to a project group. Confirm the set (e.g., include
   dashboard `stats` invalidation push? include attachments?).
2. **Payload shape** — push the **full changed entity** (`IssueResponse`) so the client can apply directly, vs push a
   thin `{type, id}` signal and let the client refetch. Proposal: **full entity for issues** (client patches its store
   directly, no refetch), thin signal for delete (`{id}`). Confirm.
3. **Echo / self-events** — the client that made the change already applied it optimistically (ch17/ch20). When the
   broadcast comes back, it must NOT double-apply or clobber an in-flight optimistic edit. Proposal: server stamps each
   event with the originating connection id; the client **skips events from its own connection** (and reconciles others
   into the store). Confirm this vs a simpler "always reconcile by id (idempotent upsert)" approach.
4. **Auth over WebSockets** — WebSockets can't send an `Authorization` header from the browser, so SignalR passes the
   JWT via the `access_token` query string; the server reads it in `JwtBearerEvents.OnMessageReceived` for hub paths.
   Proposal: do exactly this (reuse the ch05 JWT). The hub `[Authorize]`; group membership is authorized by the existing
   `IsMemberAsync` before a client joins `project-{id}`. Confirm (this is the real-world-correct, interview-gold path).
5. **Reconnection + missed events** — `@microsoft/signalr` `withAutomaticReconnect()` handles transient drops, but events
   sent while disconnected are **lost**. Proposal: on `onreconnected`, **re-join the project group AND trigger a store
   reload** (refetch the board) so the client re-syncs — teach "realtime is best-effort; reconcile on reconnect." Confirm
   vs an event-replay/sequence-number approach (probably too heavy for the guide).
6. **Presence (who's online)?** — optional, nice demo material (a "3 people viewing" avatar stack via group
   join/leave + `OnConnectedAsync`/`OnDisconnectedAsync`). Proposal: **defer** presence to keep the chapter focused on the
   core push loop (mention as the exercise). Confirm whether to include or defer.
7. **Frontend dependency** — adds `@microsoft/signalr` (npm). It's framework-agnostic, works zoneless (callbacks write
   signals → CD fires). First new client runtime dep since `@angular/cdk` (ch13) / `@ngrx/signals` (ch20) — teach the
   "library trails framework" check like ch20 if there's a peer note. Confirm acceptable.

## Backend (`reference/ch24/server/...`) — proposed

- **Hub**: `Hubs/BoardHub.cs : Hub` with `[Authorize]`. Methods: `JoinProject(int projectId)` /
  `LeaveProject(int projectId)` — authorize via `IsMemberAsync` (403/throw if not a member), then
  `Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}")`. Region `step-24.x`.
- **Broadcasts**: an `IBoardNotifier` seam (Core abstraction) implemented by a `SignalRBoardNotifier` (Infrastructure/Api)
  that wraps `IHubContext<BoardHub>`; the write handlers call `notifier.IssueChangedAsync(projectId, event)` right where
  they already call `EvictStatsAsync` (ch23). Keeping it behind an interface means the handlers don't depend on SignalR
  directly (same DIP discipline as the repos) — and it's testable.
- **Program.cs**: `AddSignalR()`; `app.MapHub<BoardHub>("/hubs/board")`; extend the JWT bearer options with
  `OnMessageReceived` reading `access_token` from the query string for `/hubs` paths; CORS already allows the client
  origin (ch11) but SignalR needs `AllowCredentials` — adjust the CORS policy (teach the `AllowAnyOrigin` + credentials
  incompatibility gotcha). Region `step-24.x`.
- No new entity / migration (events are derived from existing writes). `milestones.json` += ch24 dotnet.
- Optionally extend `TaskForge.Tests` with a hub-auth or notifier test (gated). Confirm depth.

## Frontend (`reference/ch24/client/...`) — proposed

- **`core/realtime/board-connection.ts`**: a service wrapping a `HubConnection`
  (`HubConnectionBuilder().withUrl('/hubs/board', { accessTokenFactory })`.`withAutomaticReconnect()`); connection-state
  signal (`disconnected | connecting | connected | reconnecting`); `joinProject(id)` / `leaveProject(id)`; registers
  `on('IssueChanged', ...)` handlers that dispatch into `IssuesStore`. Timers/handlers cleaned in `DestroyRef`.
- **`IssuesStore`** gains `applyRemote(event)` methods (upsert/remove an entity from a remote event, skipping self-origin
  events). The public optimistic surface (ch20 `@ngrx/signals`) is preserved; remote application is a new, small set of
  methods. This is the seam-held lesson again.
- **`issue-board`** (or `project-board`): `joinProject` on init / `leaveProject` on destroy; on `onreconnected`, reload.
  A small "live" indicator bound to the connection-state signal.
- `milestones.json` += ch24 ng.

## Architecture / teaching core

Realtime = a **second transport** alongside HTTP. The mental model: HTTP is request/response (client pulls); SignalR is a
persistent connection the server pushes over. The hub is a new seam; groups scope broadcasts; the `IBoardNotifier`
interface keeps the domain handlers transport-agnostic. The genuinely hard, interview-gold parts: **auth over WebSockets**
(query-string token + `OnMessageReceived`), **echo suppression** (don't fight your own optimistic update), and
**reconnection reconciliation** (realtime is best-effort; refetch to re-sync). Connect explicitly to ch11 (HTTP/CORS),
ch17/ch20 (optimistic store the remote events must compose with), ch23 (the write/evict points that become broadcast
points).

## Live demo

A **two-client** simulation: two side-by-side mini-boards in one component; a control to "post a move from Client A" that,
after a simulated network hop, appears in Client B's board — with a connection-state pill (connected / reconnecting) and a
toggle to "drop the connection" showing events missed while disconnected, then "reconnect" triggering a re-sync. All
in-memory (no real socket); timers cleaned in `DestroyRef`. Teaches the push + reconnect-reconcile loop visually.

## Teaching outline (~16–18 steps, proposed)

Why realtime (pull vs push); the hub + groups; the `IBoardNotifier` seam + wiring it at the existing write points; auth
over WebSockets (query-string token, `OnMessageReceived`, the CORS `AllowCredentials` gotcha); the Angular `HubConnection`
+ `accessTokenFactory`; connection-state signal + lifecycle (join on board, leave on destroy); applying remote events into
the `@ngrx/signals` store; **echo suppression** (skip self-origin); **reconnection** (`withAutomaticReconnect` + reload on
`onreconnected`); what's still missing (scaling out = backplane/Redis tease for ch25, presence as exercise). Quiz ≥6,
proveIt ≥4 (two clients see each other's create/move; unauthenticated hub connect rejected; non-member `JoinProject`
rejected; kill+reconnect re-syncs), exercise (add presence OR broadcast comments), terms ≥6 (SignalR, hub, group,
WebSocket, `IHubContext`, automatic reconnect, backplane, access-token-factory).

## Verification

- Snapshot compiles (dotnet + ng). Gates green. **Two-client runtime smoke** (two browser contexts / two tokens):
  client A creates/moves an issue, client B's board updates live without refresh; unauthenticated hub connection
  rejected; non-member `JoinProject` rejected; drop + reconnect re-syncs the board; one's own optimistic edit isn't
  double-applied. Dual-width clean; 0 console errors.

## Done when

Decisions confirmed → snapshot built + runtime-proven (two clients) + content (delegable) + gates + review + commit +
progress log. Then ch25 Ship (Docker/CI/deploy), ch26 Capstone — each needs its own spec.
