# Judge0 Integration Notes

## Required Environment Variables

```bash
JUDGE0_BASE_URL=http://judge0-server:2358
JUDGE0_CPU_TIME_LIMIT=10
JUDGE0_WALL_TIME_LIMIT=15
JUDGE0_MEMORY_LIMIT_KB=262144
```

## Local Docker Compose Setup

Project dang chay Judge0 self-hosted trong `docker-compose.yml`.

| Service | Purpose |
| --- | --- |
| `judge0-server` | HTTP API cua Judge0, expose local tai `http://localhost:2358` |
| `judge0-workers` | Xu ly queue va execute submissions trong sandbox |
| `judge0-db` | PostgreSQL rieng cua Judge0 |
| `judge0-redis` | Redis queue/cache rieng cua Judge0 |

Backend app khong goi Judge0 public nua. Trong Docker network, API dung:

```text
JUDGE0_BASE_URL=http://judge0-server:2358
```

Chay stack:

```bash
docker compose up --build
```

Kiem tra Judge0 local:

```bash
curl http://localhost:2358/languages
```

Judge0 can `privileged: true` de sandbox execution hoat dong dung trong container.

## Language Map For MVP

Judge0 language IDs depend on the deployed Judge0 version. Confirm IDs from `/languages` after starting Judge0.

| App language | Typical Judge0 name | Notes |
| --- | --- | --- |
| `cpp` | C++ | Need compile |
| `python` | Python 3 | Good first demo language |

## Backend Flow

1. Validate request body.
2. Validate role: Admin or Coder.
3. Map app language to Judge0 `language_id`.
4. Submit code to Judge0 with resource limits.
5. Try `wait=true` first for MVP, fallback to polling token if needed.
6. Normalize result into app status.
7. Insert a row into `submissions`.
8. Return sanitized result to frontend.

## Week 6 Trade-Off: `wait=true` vs Polling

Current implementation uses `wait=true` first:

```text
POST /submissions?base64_encoded=false&wait=true
```

Why this is acceptable for week 6:

1. Demo flow is simple: browser waits for one API response.
2. Backend can immediately store final `stdout`, `stderr`, status, time and memory.
3. No queue table, worker, websocket or background job is required yet.

Trade-offs:

| Option | Pros | Cons | Current use |
| --- | --- | --- | --- |
| `wait=true` | Simple request/response flow, fastest to demo | API request stays open while code runs; worse under high concurrency | Primary MVP path |
| `wait=false` + polling token | Better for long jobs and async UI; easier to move to worker later | More code paths; needs retry/backoff and pending status handling | Fallback if `wait=true` is unsupported |

Week 7/Phase 2 can move toward asynchronous grading:

1. Insert submission as `queued`.
2. Send Judge0 request with `wait=false`.
3. Poll token in a worker or background process.
4. Update submission result when Judge0 finishes.
5. Notify frontend via refresh or realtime channel.

## Suggested Judge0 Request

```json
{
  "language_id": 71,
  "source_code": "print('hello')",
  "stdin": "",
  "cpu_time_limit": 10,
  "wall_time_limit": 15,
  "memory_limit": 262144
}
```

## Status Mapping

| Judge0 status | App status |
| --- | --- |
| Accepted | `accepted` |
| Wrong Answer | `wrong_answer` |
| Time Limit Exceeded | `time_limit_exceeded` |
| Compilation Error | `compilation_error` |
| Runtime Error | `runtime_error` |
| Internal Error | `judge_error` |

## Failure Handling

| Failure | User-facing behavior |
| --- | --- |
| Judge0 timeout | "Code runner timed out. Please try again." |
| Judge0 connection refused | "Code runner is temporarily unavailable." |
| Judge0 upstream 5xx | "Code runner is temporarily unavailable." |
| Unsupported language | "This language is not enabled." |
| Payload too large | "Source code or input is too large." |

Implementation note: API responses should use friendly error codes such as `JUDGE0_UNAVAILABLE` and `JUDGE0_TIMEOUT`; raw upstream stack traces or infrastructure messages should not be returned to the browser.
