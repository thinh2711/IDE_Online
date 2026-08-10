# Week 7 - Mandatory Case Study

Project: Online Code Editor tuong tu LeetCode.

Muc tieu cua case study nay la giai thich cac trade-off ky thuat quan trong khi he thong cho phep user nop code va chay code tu xa. Trong MVP hien tai, backend Node.js/Express khong tu execute code cua user. Backend chi nhan request, validate, gui payload sang Judge0, nhan ket qua, va luu snapshot vao PostgreSQL.

## 1. Current State From Week 6

| Area | Current state | Risk | Week 7 decision |
| --- | --- | --- | --- |
| Code execution | Backend goi public Judge0 CE qua `POST /submissions` | Demo phu thuoc internet va public service availability | Giu public Judge0 cho MVP, ghi ro han che |
| Run vs Submit | `Run` da co, `Submit` chua co grading rieng | Chua co accepted/wrong_answer theo hidden test cases | Them `POST /api/submissions/grade` la uu tien code tiep theo |
| Resource control | Payload Judge0 co `cpu_time_limit`, `wall_time_limit`, `memory_limit` | Neu cau hinh sai co the ton tai run qua lau/qua nang | Giu limit o config va document ro |
| Hidden tests | Admin quan ly hidden test cases, Coder khong doc truc tiep | Neu response grade lo expected output thi mat tinh cong bang | Mask hidden input/output/expected output trong response cua Coder |
| Concurrency | Moi request hien doi Judge0 tra ket qua | 20+ submission co the lam API cham va phu thuoc Judge0 | MVP chap nhan sync; Phase 2 dung queue/polling |
| Rate limit | Chua co rate limit run/submit | User co the spam request | Them in-memory rate limit neu con thoi gian |

## 2. Isolation Analysis

### 2.1 User code runs where?

User code khong chay trong Express backend container va cung khong chay trong PostgreSQL. Flow hien tai:

1. Frontend gui source code, language, stdin va optional question/session id den backend.
2. Backend validate input va tao Judge0 payload.
3. Backend gui payload sang Judge0 voi resource limits.
4. Judge0 tao sandbox execution environment, chay code, tra stdout/stderr/status/time/memory.
5. Backend luu source snapshot va result vao bang `submissions`.

Dieu nay giu backend API o vai tro orchestration layer. Backend khong spawn process bang `child_process`, khong ghi file source code ra filesystem, va khong mount thu muc user code vao container API.

### 2.2 Why can one user's code not see another user's files/processes?

Trong MVP, isolation duoc outsource cho Judge0:

1. Moi submission duoc gui nhu mot request doc lap sang Judge0.
2. Judge0 chiu trach nhiem tao moi sandbox/process rieng cho lan chay.
3. Backend chi luu text source code/result trong database; khong tao shared working directory cho user.
4. Submission cua user khac chi co the doc qua API history, va service da enforce rule: Admin xem tat ca, Coder chi xem submission cua chinh minh.

Voi public Judge0 CE, project khong kiem soat truc tiep implementation sandbox. Vi vay khi trinh bay demo, can noi ro rang rang isolation cua runtime phu thuoc vao Judge0. Neu self-host Judge0 o Phase 2, team can verify cau hinh worker/container, network policy, filesystem mount, process limit va update path cua image Judge0.

### 2.3 Where are resource limits configured?

Resource limits nam trong backend Judge0 config:

| Limit | Source | Purpose |
| --- | --- | --- |
| CPU time | `judge0Config.cpuTimeLimit` | Chan code dung CPU qua lau |
| Wall time | `judge0Config.wallTimeLimit` | Chan request bi treo do sleep/I/O/wait |
| Memory | `judge0Config.memoryLimitKb` | Chan code dung qua nhieu memory |
| Polling | `MAX_POLL_ATTEMPTS` va `POLL_INTERVAL_MS` trong Judge0 client | Chan backend doi ket qua qua lau khi fallback sang polling |
| Payload size | `MAX_SOURCE_CODE_LENGTH`, `MAX_STDIN_LENGTH` trong submissions service | Chan request body qua lon truoc khi goi Judge0 |

Trong MVP, resource limits duoc dat tai API payload gui den Judge0. Backend van can rate limit rieng vi resource limit cua Judge0 chi kiem soat tung lan execute, khong kiem soat viec mot user gui qua nhieu request.

## 3. Judge0 Failure Analysis

### 3.1 Failure matrix

| Failure scenario | Current backend behavior | User-facing message | Operational note |
| --- | --- | --- | --- |
| DNS/network/connection refused | `fetch` throw, backend map thanh `JUDGE0_UNAVAILABLE` status 502 | "Code runner is temporarily unavailable" | Can log base URL va error noi bo |
| Judge0 upstream 5xx | Backend map thanh `JUDGE0_UNAVAILABLE` status 502 | "Code runner is temporarily unavailable" | Khong expose upstream detail cho user |
| Judge0 wait mode not supported/unstable | Backend fallback tu `wait=true` sang `wait=false` va polling theo token | Neu polling thanh cong thi user van co result | Day la fallback dang co |
| Polling qua lau | Backend throw `JUDGE0_TIMEOUT` status 504 | "Code runner timed out. Please try again." | Can phan biet timeout cua Judge0 voi code TLE |
| Code time limit exceeded | Judge0 status duoc normalize thanh `time_limit_exceeded` | Submission status hien TLE | Day la ket qua grading, khong phai loi he thong |
| Compilation error | Judge0 status duoc normalize thanh `compilation_error` | Hien stderr/compile output phu hop | Khong retry vi day la loi code user |
| Runtime error | Judge0 status duoc normalize thanh `runtime_error` | Hien stderr/message phu hop | Khong retry vi thuong la loi code user |
| Unsupported language | Backend reject truoc khi goi Judge0 voi `UNSUPPORTED_LANGUAGE` | "This language is not enabled" | Danh sach ngon ngu nam trong config |
| Invalid question id | Backend reject voi `QUESTION_NOT_FOUND` | "Question not found" | Khong goi Judge0 khi metadata khong hop le |

### 3.2 Retry/backoff decision

Trong MVP, retry chi nen ap dung cho loi transient cua he thong, khong retry loi code user.

Nen retry:

1. Network error truoc khi nhan response.
2. HTTP 502/503/504 tu Judge0.
3. Polling request bi loi tam thoi khi da co token.

Khong nen retry:

1. `compilation_error`.
2. `runtime_error`.
3. `wrong_answer`.
4. `time_limit_exceeded` cua chinh code user.
5. `unsupported language`.

Backoff de xuat cho Week 7/MVP: toi da 2 lan retry, delay 300ms -> 800ms, co jitter nho. Neu van fail thi tra friendly error va log chi tiet noi bo.

### 3.3 Friendly error strategy

User-facing message can ngan gon va khong lo chi tiet infrastructure:

1. Runner unavailable: "Code runner is temporarily unavailable. Please try again."
2. Runner timeout: "Code runner timed out. Please try again."
3. Unsupported language: "This language is not enabled."
4. Payload too large: "Source code or input is too large."

Internal log nen co:

1. Request id/user id/submission id neu co.
2. Judge0 upstream status code.
3. Latency cua request sang Judge0.
4. Normalized status va raw Judge0 status id.
5. Retry attempt count.

## 4. Concurrency Analysis

### 4.1 Current synchronous behavior

Hien tai `POST /api/submissions/run` dung request/response synchronous:

1. Client gui code.
2. Backend goi Judge0 `wait=true`.
3. Neu Judge0 wait mode khong phu hop, backend submit `wait=false` va polling den khi xong.
4. Backend insert mot row vao `submissions`.
5. Client nhan result.

Cach nay tot cho demo vi don gian va de debug. Trade-off la request API bi giu mo trong khi cho Judge0.

### 4.2 10 concurrent submissions

Voi 10 submissions ngan:

1. Express co the xu ly vi phan lon thoi gian la I/O wait sang Judge0.
2. Bottleneck chinh la latency/rate limit cua public Judge0.
3. PostgreSQL insert 10 row khong phai bottleneck lon.
4. User co the thay response cham neu Judge0 queue lau.

Expected MVP behavior: tat ca request nen tra ve thanh cong hoac friendly error; khong lam crash API. Can test bang 10 request song song voi code nhanh nhu print/console.log.

### 4.3 20+ concurrent submissions

Voi 20+ submissions hoac code long-running:

1. Nhieu request API bi giu mo cung luc.
2. Public Judge0 co the throttle, queue lau, hoac tra 5xx.
3. Backend co the gap nhieu polling loop cung luc.
4. Client co the timeout truoc khi backend co result.
5. Neu khong rate limit, mot user co the chiem phan lon capacity demo.

Expected MVP behavior: he thong co the cham nhung can fail cleanly. Khong nen crash backend, khong expose stack trace, va khong tao duplicate/noisy state trong DB neu Judge0 fail truoc khi co result.

### 4.4 Bottleneck breakdown

| Layer | Bottleneck | Current mitigation | Phase 2 improvement |
| --- | --- | --- | --- |
| Frontend | User bam Run/Submit lien tuc | Disable button while running tren UI neu co | Debounce/throttle action |
| API | Request bi giu khi cho Judge0 | Timeout/poll attempt limit | Return `submission_id` ngay va poll status |
| Judge0 | Public runner queue/rate/availability | Friendly error mapping | Self-host Judge0 + worker autoscaling |
| Database | History query tang nhanh | Index theo `user_id, created_at`, `question_id, created_at`, `status` | Pagination bat buoc, archive old rows |
| Observability | Kho biet loi o dau | Error code co cau truc | Metrics latency/error rate/retry count |

### 4.5 Recommended concurrency design after MVP

Phase 2 nen doi sang async grading:

1. API tao submission voi status `queued`.
2. API tra ve `submission_id` ngay.
3. Background worker lay job tu queue va goi Judge0.
4. Worker update status/result vao DB.
5. Frontend poll `/api/submissions/:id` hoac dung websocket de cap nhat realtime.

Thiet ke nay giam thoi gian giu HTTP request, de rate limit hon, va cho phep scale worker doc lap voi API.

## 5. Reviewer/Realtime Phase 2 Note

Realtime Coder -> Reviewer nen defer sau MVP vi phu thuoc vao cac nen tang sau:

1. Auth va role da on dinh.
2. Question/test case/submission flow da chay duoc end-to-end.
3. Code execution co rate limit va friendly failure.
4. Submission history co source snapshot de reviewer xem lai.
5. Co decision ve websocket scaling va session ownership.

Neu lam realtime qua som, project se tang do phuc tap nhung van chua giai quyet core risk lon nhat la safe execution va grading. Week 7 vi vay uu tien grading/history/case study truoc.

Dieu kien truoc khi lam realtime:

1. Tao module `sessions` dung 3-layer architecture.
2. Co API tao/join/end session.
3. Co permission ro: Coder owner, Reviewer join theo code, Admin xem tat ca.
4. Co storage cho session events neu can replay/debug.
5. Co rate limit cho socket events de tranh spam.

## 6. Technical Debt

### 6.1 Temporary decisions in MVP

| Debt | Why accepted now | Risk |
| --- | --- | --- |
| Public Judge0 CE | Nhanh de demo, khong can van hanh runner | Phu thuoc internet/service ben ngoai |
| Sync run request | Don gian, it moving parts | Khong scale tot khi concurrency cao |
| Chua co `grade` endpoint | Week 6 tap trung Run Code | Submit chua giong LeetCode that |
| Chua co rate limit | Giam scope MVP | De spam runner/API |
| Chua co retry/backoff day du | Failure mapping da co co ban | Loi transient co the lam demo fail |
| Chua co pagination/filter server-side manh | Data demo con nho | History lon se cham |
| Submission status dang gan voi Judge0 execution status | De luu nhanh ket qua run | Grade verdict can model rieng hon |

### 6.2 If we had 3 more months

Neu co them 3 thang, cac cai tien nen lam theo thu tu:

1. Self-host Judge0 trong Docker Compose/Kubernetes va lock down network/filesystem/resource policy.
2. Doi run/grade sang async queue voi worker rieng.
3. Them `POST /api/submissions/grade` day du: chay tat ca test cases, normalize output, tinh passed/total/verdict.
4. Luu grade result chi tiet o bang rieng, vi mot submission co nhieu test case results.
5. Them rate limit theo user/IP cho Run va Submit.
6. Them pagination/filter server-side cho history.
7. Them observability: request id, latency metrics, Judge0 error rate, queue depth.
8. Them automated tests cho hidden test masking, role access, Judge0 failure, concurrent submissions.
9. Them realtime review sau khi execution/grading da on dinh.

## 7. Week 7 Completion Checklist

| Item | Status | Evidence |
| --- | --- | --- |
| Isolation analysis | Done | Sections 2.1-2.3 |
| Judge0 failure analysis | Done | Sections 3.1-3.3 |
| Concurrency analysis | Done | Sections 4.1-4.5 |
| Reviewer/realtime Phase 2 note | Done | Section 5 |
| Technical debt | Done | Section 6 |
| Next code priority identified | Done | `POST /api/submissions/grade` |

## 8. Final Recommendation For Week 7 Implementation

Sau khi case study hoan thanh, viec code nen lam dau tien la `POST /api/submissions/grade`.

Scope toi thieu:

1. Backend route/controller/service/repository dung dung 3-layer architecture.
2. Lay question va test cases trong repository.
3. Chay source code qua tung test case bang Judge0.
4. Normalize stdout va expected output truoc khi compare.
5. Luu submission voi verdict tong hop.
6. Response cho Coder chi tra passed/total/status, khong tra expected output cua hidden test cases.
7. Frontend tach nut `Submit` de goi grade endpoint.
