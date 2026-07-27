# MVP Backlog

## Scope Priority

MVP hiện tại ưu tiên **Admin + Coder first**:

1. Admin quản lý user, question và test case.
2. Coder đọc đề, chạy code, xem output và lịch sử submission.
3. Reviewer/Viewer realtime chuyển sang Phase 2 để tránh làm loãng demo core flow.

## Milestone 1: RBAC Foundation

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Add user role | `users.role` column | New users default to `coder` |
| Role middleware | `authorizeRoles(...roles)` | Protected route returns 403 if role is invalid |
| Admin user endpoint | `GET /api/users`, `PATCH /api/users/:id/role` | Only Admin can list/update roles |

## Milestone 2: Question Bank

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Questions module | CRUD APIs | Admin can create/update/delete; authenticated users can read |
| Test cases module | CRUD APIs | Hidden test cases are never exposed to Coder |
| Frontend admin form | Question and test case UI | Admin can maintain a simple problem bank |

## Milestone 3: Code Execution

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Judge0 config | `JUDGE0_BASE_URL`, language map | Backend can call Judge0 health/submission API |
| Run endpoint | `POST /api/submissions/run` | Coder receives stdout/stderr/status/time/memory |
| History table | `submissions` | Every run stores code snapshot and result |
| Output panel | Frontend result view | User sees output, error, TLE/RE clearly |

## Milestone 4: Auto Grading

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Grade endpoint | `POST /api/submissions/grade` | Runs against question test cases |
| Output comparison | Normalized compare | Accepted only when all test cases pass |
| Result detail | Test case summary | Hidden case output is masked for Coder |

## Milestone 5: Demo Hardening

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Error handling | Friendly API errors | Judge0 down does not crash app |
| Docker Compose update | App + DB + Judge0 | One command starts demo stack |
| Demo seed data | Admin, questions, test cases | Demo can start from clean database |

## Phase 2: Reviewer / Realtime Session

| Task | Output | Acceptance criteria |
| --- | --- | --- |
| Sessions module | Create/join/end session APIs | Coder can create join code |
| Socket.io server | `/sessions` namespace | Reviewer receives code updates without refresh |
| Debounced editor sync | Client sends update every ~300ms | Typing stays smooth and server is not spammed |
