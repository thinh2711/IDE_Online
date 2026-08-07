# Week 3-8 Execution Plan

Project: Online Code Editor tuong tu LeetCode.

Nguyen tac chinh cua giai doan nay: tai lieu phan tich/thiet ke la bat buoc, code demo la de chung minh thiet ke kha thi. Khong can feature-complete.

## Tong quan deliverable

| Week | Trong tam | Tai lieu bat buoc | Code nen lam |
| --- | --- | --- | --- |
| 3 | Requirement Analysis | Requirement doc, user story, edge case, risk, cau hoi mentor | Chua can code; chi doc repo va chot scope |
| 4 | High Level Design | C4, ERD, tech decision, scalability analysis | Tao migration/schema draft neu can |
| 5 | Low Level Design | API spec, sequence diagram, RBAC, error/logging/security | Tao skeleton module theo API spec |
| 6 | Demo Core Flow 1 | Cap nhat design neu thay doi | Code editor page + run code endpoint |
| 7 | Demo Core Flow 2 | Case study isolation/failure/concurrency | History + grading basic; realtime reviewer de Phase 2 |
| 8 | Review & Presentation | Final report, AI reflection, performance note | Fix demo, docker compose, polish |

## Folder tai lieu de xuat

```text
docs/
  online-code-editor-prep.md
  mvp-backlog.md
  judge0-integration.md
  week-3-to-8-plan.md
  week-3-requirements.md
  week-4-hld.md
  week-5-lld.md
  week-6-implementation.md
  week-7-case-study.md
  week-8-final-report.md
```

## Week 3 - Requirement Analysis

### Muc tieu

Bien y tuong "online code editor" thanh requirement ro rang, co scope MVP, co edge case va risk.

### Tai lieu can hoan thanh

Tao file `docs/week-3-requirements.md` gom:

1. Context va problem statement.
2. User types: Admin, Coder, Viewer.
3. MVP scope va out-of-scope.
4. 10-15 user stories theo format:
   `As a [role], I want [action], so that [benefit]`.
5. Acceptance criteria cho tung flow quan trong.
6. Edge case list >= 10 dong.
7. Risk list: Risk, Probability, Impact, Mitigation.
8. Cau hoi nguoc cho mentor >= 5 cau.
9. AI QA reflection: AI hoi duoc gi hay, gi khong dung.

### Code nen lam

Chua nen code feature moi. Chi nen:

1. Doc repo hien tai.
2. Chay app existing neu can.
3. Ghi lai app da co gi: auth, frontend, Docker, PostgreSQL.
4. Xac dinh flow demo P0:
   `Coder viet code -> Run -> Backend goi Judge0 -> Luu submission -> Hien output`.

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| Chot MVP vs Phase 2 | [ ] |
| Co >= 10 user stories | [ ] |
| Co >= 10 edge cases | [ ] |
| Co >= 5 cau hoi mentor | [ ] |
| Co risk list | [ ] |
| Mentor review requirement | [ ] |

## Week 4 - High Level Design

### Muc tieu

Thiet ke kien truc tong the va database schema. Giai thich duoc vi sao chon tech stack.

### Tai lieu can hoan thanh

Tao file `docs/week-4-hld.md` gom:

1. C4 Level 1: System Context.
2. C4 Level 2: Container diagram.
3. ERD chi tiet.
4. Giai thich quan he bang.
5. Index de xuat va ly do.
6. Tech Stack Decision Record.
7. Scalability analysis: it nhat 2 bottleneck.
8. HLD case study:
   - Isolation: user A co doc duoc file user B khong?
   - Judge0 down thi he thong lam gi?

### Code nen lam

Chi code neu requirement da on:

1. Them `role` vao users.
2. Tao middleware `authorizeRoles`.
3. Draft database migration trong `backend/src/config/db.js` hoac tach migration neu project doi.

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| Co C4 Level 1 | [ ] |
| Co C4 Level 2 | [ ] |
| Co ERD >= 5 bang | [ ] |
| Giai thich normalize/denormalize | [ ] |
| Co tech decision record | [ ] |
| Co scalability bottleneck | [ ] |
| Mentor review HLD | [ ] |

## Week 5 - Low Level Design

### Muc tieu

Bien HLD thanh ban thiet ke implement duoc: API, sequence, RBAC, error, logging, security.

### Tai lieu can hoan thanh

Tao file `docs/week-5-lld.md` gom:

1. API spec day du cho MVP.
2. Request/response examples.
3. Status code va error code.
4. Sequence diagram cho:
   - Run code.
   - Realtime code sync.
5. RBAC matrix.
6. Error handling strategy.
7. Logging strategy.
8. Security checklist:
   - JWT expiry.
   - Input validation.
   - SQL injection.
   - XSS khi hien output/source code.
   - Rate limit run code.
   - Hidden test case leakage.

### Code nen lam

Tao skeleton theo dung `AGENTS.md`, chua can full logic:

1. Module `questions`.
2. Module `test-cases`.
3. Module `submissions`.
4. Judge0 client/config file.
5. Frontend API files: `questions.js`, `submissions.js`.

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| API spec co day du endpoint MVP | [ ] |
| Co request/response example | [ ] |
| Co >= 2 sequence diagrams | [ ] |
| Co RBAC matrix | [ ] |
| Co error/logging strategy | [ ] |
| Co security checklist | [ ] |
| Skeleton code khop API spec | [ ] |

## Week 6 - Implementation Core Flow: Run Code

### Muc tieu

Demo duoc P0: user viet code, bam Run, nhan ket qua tu backend. Neu chua co Judge0 that, co the bat dau bang mock client roi thay sau.

### Tai lieu can cap nhat

1. Cap nhat `docs/week-5-lld.md` neu API thay doi.
2. Ghi lai trade-off khi implement: cho Judge0 `wait=true` hay polling token.
3. Ghi known issues vao `docs/week-7-case-study.md` de phan tich tiep.

### Code nen lam

Backend:

1. `POST /api/submissions/run`.
2. Validate body: language, sourceCode, stdin, questionId optional.
3. Judge0 client:
   - MVP co the `wait=true`.
   - Set time/memory limit.
   - Map status.
4. Luu submission vao PostgreSQL.
5. Tra result cho frontend.

Frontend:

1. Tao `EditorPage`.
2. Them editor UI:
   - Language select.
   - Source code editor.
   - Stdin panel.
   - Run button.
   - Output/error panel.
3. Goi API qua `frontend/src/api/submissions.js`.

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| Run endpoint co validation | [ ] |
| Backend handle Judge0 error friendly | [ ] |
| Submission duoc luu DB | [ ] |
| Frontend bam Run hien output | [ ] |
| Co test hoac curl manual test | [ ] |
| Docs duoc cap nhat theo code thuc te | [ ] |

## Week 7 - Implementation Plus Case Study

### Muc tieu

Bo sung 1 flow P1 va hoan thanh case study bat buoc. Theo scope moi, uu tien Admin + Coder first:

1. Auto grading basic voi question/test case.
2. Submission history cho Coder/Admin.
3. Realtime Coder -> Reviewer de Phase 2.

Neu thoi gian it, uu tien case study va demo run code on dinh hon la them nhieu feature do dang.

### Tai lieu can hoan thanh

Tao file `docs/week-7-case-study.md` gom:

1. Isolation analysis:
   - User code chay o dau?
   - Vi sao khong thay file/process user khac?
   - Gioi han resource nam o dau?
2. Judge0 failure analysis:
   - Timeout.
   - Connection refused.
   - Internal error.
   - Retry/backoff/queue/friendly error.
3. Concurrency analysis:
   - 10 concurrent submissions.
   - 20+ submissions.
   - Bottleneck: API, Judge0 worker, DB write.
4. Reviewer/realtime Phase 2 note:
   - Ly do defer realtime sau MVP.
   - Dieu kien can co truoc khi lam realtime.
5. Technical debt:
   - Dang lam tam gi?
   - Neu co them 3 thang se sua gi?

### Code nen lam

Option A - Grading:

1. CRUD question/test case basic cho Admin.
2. `POST /api/submissions/grade`.
3. Chay code qua test cases.
4. Mask hidden test case output cho Coder.

Option B - History:

1. `GET /api/submissions` hoan thien filter.
2. Frontend history table cho Coder/Admin.
3. Chi tiet submission gom code snapshot, stdout/stderr/status.
4. Admin co the loc theo question/user neu con thoi gian.

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| Case study isolation/failure/concurrency xong | [ ] |
| Demo P0 van chay on | [ ] |
| Co them 1 flow P1: grading hoac history | [ ] |
| Cap nhat docs neu design doi | [ ] |
| Ghi technical debt ro rang | [ ] |

## Week 8 - Review, Reflection, Presentation

### Muc tieu

Dong goi project thanh mot cau chuyen ro: requirement -> design -> demo -> trade-off -> bai hoc.

### Tai lieu can hoan thanh

Tao file `docs/week-8-final-report.md` gom:

1. Problem summary.
2. Requirement summary.
3. Architecture summary.
4. ERD summary.
5. API/RBAC summary.
6. Demo script.
7. Case study summary.
8. Technical debt and roadmap.
9. AI reflection:
   - AI giup gi.
   - AI sai o dau.
   - Minh verify bang cach nao.
   - Bai hoc khi dung AI.
10. Appendix: link toi cac file docs.

### Code nen lam

1. Fix bug demo.
2. Chuan hoa README cach chay.
3. Cap nhat Docker Compose neu demo can Judge0/Socket.io.
4. Them seed data neu can demo nhanh.
5. Neu kip: load test co ban cho endpoint run code va ghi ket qua.

### Presentation outline 20-30 phut

| Phan | Noi dung | Thoi gian |
| --- | --- | --- |
| Problem & Requirement | Bai toan, role, MVP, edge case quan trong | 5 phut |
| Architecture & Design | C4, ERD, tech decision, trade-off | 10 phut |
| Demo | Run code va flow P1 neu co | 5 phut |
| Case Study | Isolation, Judge0 failure, concurrency | 5 phut |
| Reflection | Technical debt, roadmap, AI reflection | 5 phut |

### Checklist cuoi tuan

| Item | Done |
| --- | --- |
| Final report xong | [ ] |
| Slide/demo script xong | [ ] |
| README cach chay ro rang | [ ] |
| Demo chay duoc tu clean start | [ ] |
| AI reflection co vi du cu the | [ ] |
| Mentor/design review feedback da ghi lai | [ ] |

## Weekly Working Rhythm

Moi tuan nen chia nhu sau:

| Ngay | Viec nen lam |
| --- | --- |
| Thu 2 | Chot muc tieu tuan, doc lai requirement, tao checklist |
| Thu 3 | Lam tai lieu/thiet ke truoc, hoi mentor neu co ambiguity |
| Thu 4 | Code phan nho nhat co the demo, commit theo module |
| Thu 5 | Test manual/API, cap nhat docs neu code khac thiet ke |
| Thu 6 | Review, viet lesson learned, chuan bi demo ngan |

## Rule De Khong Bi Lech Scope

1. Neu tai lieu chua ro, dung code feature moi.
2. Moi endpoint moi phai co trong API spec truoc.
3. Moi bang moi phai co trong ERD truoc.
4. Moi role permission moi phai co trong RBAC matrix truoc.
5. Demo chi can 1-2 core flow chay chac.
6. Khi AI generate code, phai review va ghi lai diem da sua.
7. Neu code va design khac nhau, cap nhat design trong cung ngay.

## Suggested Implementation Order

1. RBAC:
   - `users.role`
   - `authorizeRoles`
2. Questions:
   - `questions` table
   - list/detail/create/update/delete
3. Test cases:
   - `test_cases` table
   - Admin CRUD
   - Hidden case masking
4. Submissions:
   - `submissions` table
   - `POST /api/submissions/run`
   - history
5. Judge0:
   - config
   - client
   - status mapping
   - failure handling
6. Frontend editor:
   - editor page
   - language/stdin/output
7. Realtime or grading:
   - choose one P1 flow for week 7
8. Docker/demo:
   - update compose
   - seed data
   - README
