# Week 6 - Implementation Core Flow: Run Code

Project: Online Code Editor tuong tu LeetCode.

Muc tieu tuan 6 la demo duoc flow P0:

```text
Coder viet code -> bam Run -> Backend goi Judge0 -> luu submission -> Frontend hien output/error
```

## 1. Scope

Tuan 6 tap trung vao **Run Code**. Cac phan grading day du, hidden test case scoring, realtime reviewer va submission analytics de sang Week 7/Phase 2.

In scope:

1. Editor page cho coder/admin viet code.
2. `POST /api/submissions/run`.
3. Validate request body.
4. Goi Judge0 voi resource limit.
5. Normalize status Judge0.
6. Luu submission vao PostgreSQL.
7. Hien stdout/stderr/status/time/memory tren frontend.
8. Frontend so sanh stdout voi expected output cua sample/visible test case de hien `accepted` hoac `wrong_answer` trong IDE.
9. Friendly error khi Judge0 loi.

Out of scope:

1. `Submit` dung nghia auto grading.
2. Chay toan bo hidden test cases.
3. Rate limit production.
4. Async worker/queue.
5. Realtime reviewer.

## 2. Backend Implementation

### Endpoint

```http
POST /api/submissions/run
Authorization: Bearer <token>
Content-Type: application/json
```

Allowed roles:

```text
admin, coder
```

Source files:

1. `backend/src/modules/submissions/submissions.routes.js`
2. `backend/src/modules/submissions/submissions.controller.js`
3. `backend/src/modules/submissions/submissions.service.js`
4. `backend/src/modules/submissions/submissions.repository.js`
5. `backend/src/modules/submissions/judge0.client.js`

### Request Body

```json
{
  "questionId": 1,
  "sessionId": null,
  "language": "python",
  "sourceCode": "print('hello')",
  "stdin": ""
}
```

Validation:

| Field | Rule |
| --- | --- |
| `language` | Required, must exist in Judge0 language map |
| `sourceCode` | Required, not blank |
| `stdin` | Optional, max length enforced |
| `questionId` | Optional positive integer, must exist if provided |
| `sessionId` | Optional positive integer |

Payload limits:

| Item | Limit |
| --- | --- |
| Source code | 100000 characters |
| Stdin | 20000 characters |

## 3. Judge0 Integration

Runtime config:

```text
JUDGE0_BASE_URL
JUDGE0_CPU_TIME_LIMIT
JUDGE0_WALL_TIME_LIMIT
JUDGE0_MEMORY_LIMIT_KB
```

Current Docker Compose uses:

```text
JUDGE0_BASE_URL=https://ce.judge0.com
```

Default local config expects:

```text
http://judge0-server:2358
```

### Language Map

| App language | Judge0 language id |
| --- | --- |
| `c` | 50 |
| `cpp` | 54 |
| `java` | 62 |
| `javascript` | 63 |
| `python` | 71 |

### Status Mapping

| Judge0 status | App status |
| --- | --- |
| In Queue | `queued` |
| Processing | `processing` |
| Accepted | `accepted` |
| Wrong Answer | `wrong_answer` |
| Time Limit Exceeded | `time_limit_exceeded` |
| Compilation Error | `compilation_error` |
| Runtime Error | `runtime_error` |
| Internal Error | `judge_error` |
| Unknown | `unknown` |

## 4. Trade-Off: `wait=true` vs Polling

Week 6 implementation tries `wait=true` first:

```text
POST /submissions?base64_encoded=false&wait=true
```

Reason:

1. Simple request/response flow.
2. Easy to demo.
3. Backend can save final result immediately.
4. No background worker needed.

Fallback:

If Judge0 does not support `wait=true`, backend submits with `wait=false` and polls the token until the result finishes.

Trade-off:

| Option | Pros | Cons |
| --- | --- | --- |
| `wait=true` | Simple and fast for MVP | API request waits for code execution |
| Polling token | Better for long-running jobs | More moving parts |

Week 7 can move this toward async worker/queue.

## 5. Database Storage

Submission result is stored in `submissions`:

```text
id
user_id
question_id
session_id
language
source_code
stdin
stdout
stderr
status
execution_time
memory_kb
judge0_payload
created_at
```

Important behavior:

1. Week 6 stores one row after Judge0 returns final result.
2. Source code snapshot is saved for history/debugging.
3. Judge0 payload is saved for traceability.

## 6. Frontend Implementation

Source files:

1. `frontend/src/pages/EditorPage.jsx`
2. `frontend/src/api/submissions.js`

Editor UI includes:

1. Language select.
2. Source code textarea.
3. Test case/sample input panel.
4. Run button.
5. Submit button placeholder.
6. Output/error panel.
7. Execution log panel.
8. Status/time/memory display.

Current behavior:

1. `Run` calls `POST /api/submissions/run`.
2. `Submit` currently also calls the same run endpoint.
3. `Submit` will be separated into grading in Week 7.
4. Judge0 `accepted` means the program executed successfully; the IDE then compares stdout with expected output and displays `wrong_answer` when they differ.

## 7. Error Handling

| Error | API code | User-facing message |
| --- | --- | --- |
| Missing language/sourceCode | `VALIDATION_ERROR` | Language and sourceCode are required |
| Unsupported language | `UNSUPPORTED_LANGUAGE` | This language is not enabled |
| Payload too large | `PAYLOAD_TOO_LARGE` | Source code or input is too large |
| Question not found | `QUESTION_NOT_FOUND` | Question not found |
| Judge0 unavailable | `JUDGE0_UNAVAILABLE` | Code runner is temporarily unavailable |
| Judge0 timeout | `JUDGE0_TIMEOUT` | Code runner timed out. Please try again. |

Backend does not return raw Judge0 stack traces to frontend.

## 8. Manual Test Checklist

### Backend Unit Tests

```bash
npm test
```

Expected:

```text
pass
```

### Frontend Build

```bash
npm run build:web
```

Expected:

```text
build success
```

### API Manual Test

Login first and replace `<TOKEN>`:

```bash
curl -X POST http://localhost:3000/api/submissions/run \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"questionId":1,"language":"javascript","sourceCode":"console.log(\"hello\")","stdin":""}'
```

Expected response:

```json
{
  "message": "Submission executed",
  "submission": {
    "status": "accepted",
    "stdout": "hello\n"
  }
}
```

## 9. Week 6 Checklist

| Item | Status |
| --- | --- |
| Run endpoint co validation | Done |
| Backend handle Judge0 error friendly | Done |
| Submission duoc luu DB | Done |
| Frontend bam Run hien output | Done |
| Co test hoac curl manual test | Done |
| Docs duoc cap nhat theo code thuc te | Done |

## 10. Known Issues For Week 7

1. Docker Compose chua self-host Judge0, dang dung public Judge0 CE.
2. `Submit` van dang giong `Run`.
3. Chua co endpoint `POST /api/submissions/grade`.
4. Chua co auto grading qua hidden test cases.
5. Chua co rate limit run/submit.
6. Chua co async queue/background worker.
7. Chua co submission history UI day du.
8. Database `submissions.status` van luu execution status tu Judge0; verdict compare cua Run hien moi nam o frontend.
