# Submission Notes

## What I'd test next (with more time)

- **Concurrent mutation safety** — the in-memory store is a plain array shared across all requests. Under concurrent load (e.g. two simultaneous DELETEs of the same task) you could hit race conditions. Worth testing with parallel Supertest calls.
- **Input sanitisation / XSS** — currently a title like `<script>alert(1)</script>` is stored as-is. If any downstream system renders this HTML, it's an XSS vector.
- **`validators.js` edge cases** — lines 25, 28, 31 (invalid `status`/`priority` in *update*) are only partially covered. Adding tests that exercise those paths in isolation would close the remaining branch gaps.
- **Pagination edge cases** — `limit=0`, `limit=-1`, `page=0`, very large page numbers, non-numeric strings passed as `page`/`limit`. Currently `parseInt` silently falls back to defaults, which may or may not be the intended behaviour.
- **`completeTask` idempotency** — what happens if you call `PATCH /tasks/:id/complete` on a task that is already `done`? It succeeds silently today; a test should document whether that's intentional.

---

## What surprised me in the codebase

1. **`completeTask` silently mutates `priority`** — there was no comment or business context explaining why completing a task should downgrade its priority to `medium`. It looked like an accidental leftover from a copy-paste, not intentional logic.
2. **`getByStatus` uses `.includes()` on a string** — `.includes()` is normally used on arrays. Applied to `t.status` (a string) it performs a substring search, so `?status=do` would match both `"todo"` and `"done"`. Easy to miss in a quick code review.
3. **Off-by-one in pagination** — a classic `(page - 1) * limit` vs `page * limit` error. The effect is that page 1 always silently returns empty (assuming fewer items than the limit), which could be mistaken for "there are no tasks" rather than a bug.

---

## Questions I'd ask before shipping to production

1. **Persistence** — the in-memory store resets on every restart. Is a proper database (e.g. PostgreSQL, SQLite) planned, and if so, what's the migration story?
2. **Authentication / authorisation** — any authenticated user can update or delete any task. Is multi-tenancy or per-user task isolation required?
3. **Rate limiting** — there's no rate limiting on POST/PUT/DELETE. Worth adding before public exposure.
4. **`assignee` business rules** — can a task have multiple assignees? Can only the current assignee reassign it? Can a `done` task be assigned? The current implementation allows all of these freely.
5. **Status transition rules** — should arbitrary status changes be allowed (e.g. jumping from `todo` directly to `done` via PUT)? Should `PATCH /complete` be the only way to reach `done`?
6. **Error format consistency** — errors are returned as `{ error: "..." }`. Is this the agreed-on API contract, or should it follow a richer RFC 7807 Problem Details format?
