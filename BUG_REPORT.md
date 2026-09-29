# Bug Report

## 1. Pagination starts from the wrong offset

**Location:** `task-api/src/services/taskService.js`

**Expected behavior:** `page=1&limit=2` should return the first two tasks.

**Actual behavior before the fix:** The implementation calculated `offset = page * limit`, so page 1 started at index 2 and skipped the first two tasks.

**How I discovered it:** I wrote an integration test for `GET /tasks?page=1&limit=2` and an equivalent unit test for `getPaginated(1, 2)`.

**Fix:** Changed the offset calculation to `(page - 1) * limit` because API page numbers are 1-based.

## 2. Status filtering matches substrings

**Location:** `task-api/src/services/taskService.js`

**Expected behavior:** A status filter should match the requested status value exactly.

**Actual behavior before the fix:** `getByStatus` used `t.status.includes(status)`, which performs substring matching instead of exact status matching.

**How I discovered it:** I added unit and integration tests containing both `todo` and `in_progress` tasks.

**Fix:** Changed filtering to `t.status === status`.

## 3. Completing a task changes its priority

**Location:** `task-api/src/services/taskService.js`

**Expected behavior:** Completing a task should change its status and set `completedAt`, while preserving unrelated fields such as priority.

**Actual behavior before the fix:** `completeTask` always changed priority to `medium`.

**How I discovered it:** I created a high-priority task and completed it through the service and API tests.

**Fix:** Removed the forced priority change so the existing priority is preserved.

## 4. API documentation contains inconsistent status values

**Location:** `README.md`

**Expected behavior:** Documentation should match the implementation and assignment contract.

**Actual behavior:** One section described statuses as `pending | in-progress | completed`, while the implemented API uses `todo | in_progress | done`.

**Recommendation:** Align the README examples and schema with the actual API contract before production.

## Validation note

The assignment does not prescribe a response code for a task that is already assigned. I chose `409 Conflict` because the requested operation conflicts with the existing assignment. Empty, whitespace-only, missing, and non-string assignee values return `400 Bad Request`.
