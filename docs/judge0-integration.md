# Judge0 Integration Notes

## Required Environment Variables

```bash
JUDGE0_BASE_URL=http://judge0-server:2358
JUDGE0_CPU_TIME_LIMIT=10
JUDGE0_WALL_TIME_LIMIT=15
JUDGE0_MEMORY_LIMIT_KB=262144
```

## Language Map For MVP

Judge0 language IDs depend on the deployed Judge0 version. Confirm IDs from `/languages` after starting Judge0.

| App language | Typical Judge0 name | Notes |
| --- | --- | --- |
| `c` | C | Need compile |
| `cpp` | C++ | Need compile |
| `javascript` | JavaScript Node.js | Good first demo language |
| `python` | Python 3 | Good first demo language |
| `java` | Java | Class name rules may matter |

## Backend Flow

1. Validate request body.
2. Validate role: Admin or Coder.
3. Map app language to Judge0 `language_id`.
4. Submit code to Judge0 with resource limits.
5. Wait for result for MVP, or poll token later for scale.
6. Normalize result into app status.
7. Insert a row into `submissions`.
8. Return sanitized result to frontend.

## Suggested Judge0 Request

```json
{
  "language_id": 63,
  "source_code": "console.log('hello')",
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
| Unsupported language | "This language is not enabled." |
| Payload too large | "Source code or input is too large." |

