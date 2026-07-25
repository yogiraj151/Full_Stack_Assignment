# Bug Report — Task Manager API

---

## Bug 1 — Pagination offset is off by one (Page 1 returns nothing / wrong items)

**File:** `src/services/taskService.js` — `getPaginated`

**Expected behavior:**  
`GET /tasks?page=1&limit=10` should return the first 10 tasks.  
`GET /tasks?page=2&limit=10` should return tasks 11–20.

**Actual behavior:**  
`page=1` uses offset = `1 * 10 = 10`, skipping the first 10 items entirely and returning items 11–20.  
`page=2` uses offset = `2 * 10 = 20`, returning items 21–30.  
Effectively page 1 always shows what should be page 2, and the very first page of results is unreachable.

**How discovered:**  
Integration test: created 12 tasks, called `GET /tasks?page=1&limit=10`, expected 10 items starting at "Task 1" — got "Task 11" instead.

**Fix (implemented):**  
```diff
-const offset = page * limit;
+const offset = (page - 1) * limit;
```

---

## Bug 2 — `getByStatus` uses substring match instead of exact match

**File:** `src/services/taskService.js` — `getByStatus`

**Expected behavior:**  
`GET /tasks?status=todo` should return only tasks whose `status` is exactly `"todo"`.  
`GET /tasks?status=do` should return no tasks (not a valid status).

**Actual behavior:**  
The filter uses `t.status.includes(status)`, which performs a substring search.  
- `status=do` matches both `"todo"` (contains "do") and `"done"` (contains "do") — returning tasks from two different statuses.  
- `status=in` would match `"in_progress"` tasks even though `"in"` is not a valid status value.

**How discovered:**  
Unit test: created tasks with statuses `"todo"`, `"in_progress"`, `"done"`, then queried `getByStatus('do')` — expected 0 results, got 2.

**Fix (implemented):**  
```diff
-const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
+const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

## Bug 3 — `completeTask` silently resets `priority` to `"medium"` *(fixed)*

**File:** `src/services/taskService.js` — `completeTask`

**Expected behavior:**  
Marking a task complete via `PATCH /tasks/:id/complete` should only change `status` to `"done"` and set `completedAt`. The task's `priority` should be untouched.

**Actual behavior:**  
The function spreads the existing task and then hardcodes `priority: 'medium'`, unconditionally overwriting whatever priority the task had:

```js
const updated = {
  ...task,
  priority: 'medium',   // ← destructive, no business justification
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

A high-priority task silently becomes medium-priority after being completed, corrupting historical data and any priority-based reporting.

**How discovered:**  
Unit test: created a task with `priority: 'high'`, called `completeTask`, asserted `completed.priority === 'high'` — got `'medium'`.

**Fix (implemented):**  
Remove the `priority: 'medium'` line. The spread of `...task` already carries the correct priority.

```diff
 const updated = {
   ...task,
-  priority: 'medium',
   status: 'done',
   completedAt: new Date().toISOString(),
 };
```

---

## Summary

| # | Location | Severity | Fixed? |
|---|----------|----------|--------|
| 1 | `getPaginated` — wrong offset formula | High — page 1 is always empty | ✅ Yes |
| 2 | `getByStatus` — substring instead of exact match | Medium — returns wrong tasks | ✅ Yes |
| 3 | `completeTask` — resets priority to 'medium' | Medium — silent data corruption | ✅ Yes |

All three fixes are committed alongside tests that now pass to confirm correct behaviour.
