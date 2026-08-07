# Week 7 - Case Study Notes

Project: Online Code Editor tuong tu LeetCode.

File nay bat dau tu known issues cua Week 6 de Week 7 phan tich tiep ve isolation, failure va concurrency.

## 1. Known Issues From Week 6

| Issue | Current state | Why it matters | Week 7 direction |
| --- | --- | --- | --- |
| Public Judge0 dependency | Docker Compose dang dung `https://ce.judge0.com` | Demo phu thuoc internet va availability cua public service | Quyet dinh giu public cho demo hay self-host Judge0 |
| `Run` va `Submit` giong nhau | Ca hai nut dang goi `POST /api/submissions/run` | Submit chua cham hidden test cases nhu LeetCode | Them `POST /api/submissions/grade` |
| Chua co rate limit | User co the bam Run lien tuc | De gay qua tai API/Judge0 | Them in-memory rate limit cho MVP |
| Chua co async queue | Backend doi Judge0 trong request hien tai | Concurrent submissions co the lam API request bi treo lau | Can nhac queue/polling background |
| Hidden test case chua dung de grade | Coder khong xem hidden case, nhung Submit chua chay toan bo case | Chua co accepted/wrong_answer that theo question | Implement grading basic |
| Chua co manual test record chinh thuc | Co unit test, chua co bang curl/manual evidence trong docs | Kho trinh bay ket qua demo | Ghi lai request/response mau va screenshot neu can |

## 2. Isolation Analysis Draft

Current design:

1. User code khong chay trong Express API container.
2. Backend chi gui source code, stdin va resource limit sang Judge0.
3. Judge0 chiu trach nhiem sandbox process, CPU time limit, wall time limit va memory limit.
4. PostgreSQL chi luu source snapshot/result, khong execute code.

Risk can explain:

1. Neu dung public Judge0, isolation phu thuoc vao service ben ngoai.
2. Neu self-host Judge0, can cau hinh worker/container sandbox dung khuyen nghi cua Judge0.
3. API khong nen mount file system user code vao container backend.

## 3. Judge0 Failure Analysis Draft

| Failure | Current behavior | User-facing result |
| --- | --- | --- |
| Network/DNS/connection refused | Backend map loi fetch thanh `JUDGE0_UNAVAILABLE` | "Code runner is temporarily unavailable" |
| Upstream 5xx | Backend map thanh `JUDGE0_UNAVAILABLE` | "Code runner is temporarily unavailable" |
| Timeout/polling too long | Backend map thanh `JUDGE0_TIMEOUT` | "Code runner timed out. Please try again." |
| Unsupported language | Backend reject truoc khi goi Judge0 | "This language is not enabled." |

Week 7 improvement:

1. Them retry/backoff nhe cho transient network failure.
2. Ghi log Judge0 latency va upstream status.
3. Tach error message user-facing va debug log noi bo.

## 4. Concurrency Analysis Draft

Current Week 6 behavior:

1. Moi Run request giu ket noi API cho den khi Judge0 tra result.
2. `wait=true` don gian cho demo nhung chua toi uu cho nhieu concurrent submissions.
3. PostgreSQL write hien chi insert mot row sau khi co result.

Potential bottlenecks:

1. Express worker bi giu lau boi cac request dang doi Judge0.
2. Public Judge0 co rate/availability khong kiem soat duoc.
3. DB write khong phai bottleneck lon trong MVP, nhung history query can index theo `user_id, created_at`.

Week 7 test scenarios:

1. 10 concurrent run submissions voi code ngan.
2. 20+ concurrent submissions voi code sleep/long-running.
3. Judge0 unavailable trong luc user bam Run.

## 5. Week 7 Priority Recommendation

Neu thoi gian it, uu tien theo thu tu:

1. `POST /api/submissions/grade` chay qua question test cases.
2. Tach nut `Submit` tren frontend sang grade endpoint.
3. Submission history cho Coder/Admin.
4. Rate limit run/submit.
5. Self-host Judge0 hoac ghi ro ly do dung public Judge0 trong demo.
