# 📋 Task Manager API — Full Stack Assignment

A RESTful **Task Manager API** built with **Node.js + Express**, fully tested with **Jest** and **Supertest**. This project was a take-home assignment that involved reading unfamiliar code, writing tests from scratch, discovering & fixing bugs, and shipping a new feature with confidence.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4.x |
| Testing | Jest 29 + Supertest |
| ID generation | uuid v9 |
| Data store | In-memory (array) — no DB required |

---

## 📁 Project Structure

```
Take-Home-Assignment-The-Untested-API-main/
├── task-api/
│   ├── src/
│   │   ├── app.js                  # Express app entry point
│   │   ├── routes/
│   │   │   └── tasks.js            # All task route handlers
│   │   ├── services/
│   │   │   └── taskService.js      # Business logic & in-memory store
│   │   └── utils/
│   │       └── validators.js       # Input validation helpers
│   ├── tests/
│   │   ├── taskService.test.js     # Unit tests (service layer)
│   │   └── tasks.routes.test.js    # Integration tests (HTTP routes)
│   ├── jest.config.js
│   ├── package.json
│   ├── BUG_REPORT.md               # Documented bugs & fixes
│   └── SUBMISSION_NOTES.md         # Reflections & open questions
└── ASSIGNMENT.md                   # Original assignment description
```

---

## ⚙️ Setup & Running

```bash
cd task-api
npm install

npm start        # Starts server on http://localhost:3000
npm test         # Run all tests
npm run coverage # Run tests + generate coverage report
```

> **Note:** The API uses an in-memory store — no database setup needed. Data resets on every restart.

---

## 🌐 API Endpoints

### Task Shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO string | null",
  "completedAt": "ISO string | null",
  "assignee": "string | undefined",
  "createdAt": "ISO string"
}
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks?status=todo` | Filter tasks by exact status |
| `GET` | `/tasks?page=1&limit=10` | Paginated task list |
| `GET` | `/tasks/stats` | Count of tasks by status + overdue count |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/:id` | Update an existing task |
| `DELETE` | `/tasks/:id` | Delete a task (returns 204) |
| `PATCH` | `/tasks/:id/complete` | Mark a task as done |
| `PATCH` | `/tasks/:id/assign` | ⭐ **New** — Assign a person to a task |

---

## 🐛 Bugs Found & Fixed

Three bugs were discovered through testing — all three were fixed.

### Bug 1 — Pagination Off-by-One *(High Severity)*
**File:** `taskService.js` → `getPaginated()`

`GET /tasks?page=1&limit=10` was skipping the first 10 items entirely — page 1 was unreachable.

```diff
- const offset = page * limit;
+ const offset = (page - 1) * limit;
```

---

### Bug 2 — `getByStatus` Used Substring Match *(Medium Severity)*
**File:** `taskService.js` → `getByStatus()`

`?status=do` incorrectly matched both `"todo"` and `"done"` because `.includes()` performs a substring search, not an exact match.

```diff
- const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
+ const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

### Bug 3 — `completeTask` Silently Reset Priority *(Medium Severity)*
**File:** `taskService.js` → `completeTask()`

Completing a high-priority task would silently downgrade it to `"medium"` — silent data corruption with no business justification.

```diff
  const updated = {
    ...task,
-   priority: 'medium',
    status: 'done',
    completedAt: new Date().toISOString(),
  };
```

---

## ⭐ New Feature — Assign a Task

A new endpoint was added to assign a person to any task:

```
PATCH /tasks/:id/assign
Body: { "assignee": "string" }
```

**Validation rules:**
- `assignee` is **required**
- Must be a **non-empty string** (whitespace-only strings are rejected)
- Whitespace is trimmed before storing
- Reassignment (overwriting an existing assignee) is allowed

**Response:** Returns the full updated task with `200 OK`.  
**Errors:** `400` for invalid input, `404` if task does not exist.

---

## 🧪 Test Suite

**Unit Tests** (`taskService.test.js`) — service layer tested directly:
- `getAll` — empty store, mutation safety
- `create` — defaults, optional fields, unique IDs
- `findById` — found / not found
- `getByStatus` — exact match, substring edge case, unknown status
- `getPaginated` — correct pages, out-of-range
- `getStats` — status counts, overdue logic
- `update` — field merge, not found, persistence
- `remove` — success, not found
- `completeTask` — sets `done` + `completedAt`, preserves priority

**Integration Tests** (`tasks.routes.test.js`) — full HTTP stack via Supertest:
- All 9 endpoints covered (happy paths + edge cases)
- Validation errors (400), not-found (404)
- Pagination correctness (bug regression tests)
- `PATCH /assign` — missing, empty, non-string, reassignment, persistence

**Coverage:** 80%+ achieved across statements, branches, functions, and lines.

---

## 📝 Submission Notes

### What I'd test next (with more time)
- **Concurrent mutation safety** — race conditions on parallel DELETE requests against the shared in-memory array
- **Input sanitisation / XSS** — titles like `<script>alert(1)</script>` are stored as-is
- **Pagination edge cases** — `limit=0`, negative values, non-numeric strings
- **`completeTask` idempotency** — calling complete on an already-done task (currently succeeds silently)
- **`validators.js` branch coverage** — invalid status/priority paths in update requests

### What surprised me in the codebase
1. `completeTask` silently mutated `priority` — no comment or business justification; looks like an accidental copy-paste leftover
2. `getByStatus` used `.includes()` on a string — performs substring search, not exact match; easy to miss in a quick review
3. Off-by-one in pagination — the first page of results was always silently unreachable, which could be mistaken for "no tasks exist"

### Questions before shipping to production
1. **Persistence** — in-memory store resets on restart; is a real database (PostgreSQL, SQLite) planned?
2. **Auth** — any user can update or delete any task; is per-user task isolation required?
3. **Rate limiting** — no rate limiting on POST/PUT/DELETE endpoints
4. **Assignee business rules** — multiple assignees? Can a `done` task be reassigned?
5. **Status transition rules** — should arbitrary status jumps (e.g., `todo` → `done` via PUT) be allowed?
6. **Error format** — should errors follow RFC 7807 Problem Details instead of `{ error: "..." }`?

---

## 👤 Author

**Yogiraj** — [GitHub](https://github.com/yogiraj151)
