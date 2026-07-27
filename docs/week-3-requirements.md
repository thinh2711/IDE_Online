1. Context & Problem Statement (Bối cảnh & Bài toán) 

    Bối cảnh: Hệ thống được xây dựng nhằm phục vụ nhu cầu kiểm tra năng lực lập trình của ứng viên (làm bài test coding online với nhiều ngôn ngữ) và hỗ trợ người phỏng vấn (Interviewer) theo dõi trực tiếp quá trình làm bài theo thời gian thực.

    Bài toán: Đảm bảo hệ thống biên dịch và chạy code an toàn (isolated sandbox), kiểm soát tài nguyên tốt để tránh quá tải, đồng thời duy trì độ trễ truyền dữ liệu realtime cực thấp.

2. User Types & Quyền hạn (RBAC)

Hệ thống phân chia rõ ràng 3 phân quyền (Role):

    Admin (Người quản trị): Quản lý tài khoản, gán role, CRUD ngân hàng câu hỏi và test cases (bao gồm hidden test cases), xem toàn bộ lịch sử các bài nộp trên hệ thống.

    Coder (Ứng viên): Chọn câu hỏi, chọn ngôn ngữ lập trình, viết code, chạy thử với dữ liệu tùy chỉnh (Run), nộp bài chấm điểm tự động (Submit/Grade), và xem lịch sử nộp bài của chính mình.

    Viewer (Người xem/Interviewer): Tham gia vào phòng phỏng vấn qua mã join code, xem trực tiếp quá trình gõ code và kết quả chạy code của Coder theo thời gian thực, tuyệt đối KHÔNG có quyền chỉnh sửa code hay thao tác chạy bài.

3. Scope MVP vs Out-of-Scope (Biên giới tính năng)

    Nằm trong phạm vi MVP (Must-Have):

    Hệ thống Authentication & Phân quyền RBAC (Admin, Coder, Viewer).

    Giao diện Code Editor hỗ trợ nhập mã nguồn, chọn tối thiểu 5 ngôn ngữ (C, C++, JavaScript, Python, Java) và khu vực nhập stdin. VS Code được dùng làm môi trường phát triển source code của dự án.

    Tích hợp Judge0 Self-hosted để compile và thực thi code an toàn, cấu hình đầy đủ giới hạn tài nguyên.

    Tính năng Tự động chấm điểm (Auto Grading) dựa trên các Hidden Test Cases do Admin thiết lập.

    Đồng bộ mã nguồn Realtime 1 chiều từ Coder sang các Viewer thông qua Socket.io.

    Lưu trữ và hiển thị chi tiết Lịch sử nộp bài (Metadata, code snapshot, stdout, stderr, time, memory).

    Nằm ngoài phạm vi MVP (Out-of-Scope):

    Tính năng hai hay nhiều Coder cùng nhảy vào sửa chung một file (Multi-coder collaborative với conflict resolution như OT/CRDT).

4. Danh sách 10 - 15 User Stories (Kèm Acceptance Criteria)

    US-01 [Coder]: Chạy thử code cá nhân (Run)

        Mô tả: As a Coder, I want to execute my code with custom stdin, so that I can debug and verify my output before formal submission.

        Acceptance Criteria:

            Nút "Run" chỉ active khi vùng code editor không trống và đã chọn ngôn ngữ.

            Khi bấm Run, nút bị disable tạm thời và hiển thị loading để tránh spam.

            Kết quả trả về hiển thị đầy đủ: stdout, stderr, execution_time, và memory_usage.

    US-02 [Coder]: Nộp bài chấm điểm (Submit/Grade)

        Mô tả: As a Coder, I want to submit my code against all hidden test cases, so that I can see my final correctness verdict.

        Acceptance Criteria:

            Hệ thống gửi mã nguồn qua backend để chạy qua toàn bộ test cases của câu hỏi.

            Trạng thái bài nộp phải được chuẩn hóa thành 1 trong các dạng: accepted, wrong_answer, time_limit_exceeded, compilation_error, runtime_error.
            
            Tuyệt đối chặn (mask) không hiển thị expected_output hoặc stdout của các hidden test case cho Coder.

    US-03 [Viewer]: Theo dõi Realtime quá trình làm bài

        Mô tả: As a Viewer, I want to see the candidate's code updates in real-time, so that I can observe their coding behavior and logic progression.

        Acceptance Criteria:

            Viewer kết nối vào session bằng join_code và ở trạng thái Read-Only (không thể gõ, không thể ấn nút Run/Submit).

            Màn hình Viewer tự động cập nhật ký tự mà không cần refresh trang.

            Độ trễ truyền tải dữ liệu giữa Coder và Viewer phải nhỏ hơn 1 giây.

    US-04 [Public User]: Đăng ký tài khoản

        Mô tả: As a new user, I want to register an account, so that I can access the platform with the correct default role.

        Acceptance Criteria:

            User có thể đăng ký bằng username, full name và password hợp lệ.

            Username không được trùng với user đã tồn tại.

            Tài khoản mới mặc định có role là Coder, trừ khi Admin thay đổi sau đó.

    US-05 [User]: Đăng nhập và duy trì phiên làm việc

        Mô tả: As a user, I want to log in and receive a secure session token, so that I can access features allowed for my role.

        Acceptance Criteria:

            Login thành công trả về JWT và thông tin user cơ bản.

            Login sai username hoặc password trả lỗi rõ ràng, không tiết lộ password đúng hay sai cụ thể.

            Các API protected yêu cầu header Authorization hợp lệ, nếu thiếu token phải trả 401.

    US-06 [Coder]: Xem và chọn câu hỏi lập trình

        Mô tả: As a Coder, I want to browse and open programming questions, so that I can choose a problem to solve.

        Acceptance Criteria:

            Coder xem được danh sách câu hỏi gồm title, difficulty và mô tả ngắn.

            Coder xem được chi tiết câu hỏi, sample input và sample output.

            Hidden test cases không được trả về trong API dành cho Coder.

    US-07 [Coder]: Tạo coding session cho buổi phỏng vấn

        Mô tả: As a Coder, I want to create a coding session with a join code, so that a Viewer can follow my work during an interview.

        Acceptance Criteria:

            Coder có thể tạo session gắn với một câu hỏi cụ thể.

            Hệ thống tạo join_code duy nhất và đủ khó đoán để tránh user lạ join bừa.

            Session có trạng thái rõ ràng: active hoặc ended.

    US-08 [Coder]: Xem lịch sử chạy/nộp bài của bản thân

        Mô tả: As a Coder, I want to view my submission history, so that I can review previous attempts and results.

        Acceptance Criteria:

            Coder chỉ xem được submission do chính mình tạo.

            Danh sách history hiển thị language, status, execution_time, memory_usage và created_at.

            Chi tiết submission hiển thị code snapshot, stdin, stdout, stderr nhưng vẫn không lộ hidden expected_output.

    US-09 [Admin]: Tạo và cập nhật câu hỏi lập trình

        Mô tả: As an Admin, I want to create and update programming questions, so that the platform has a controlled problem bank.

        Acceptance Criteria:

            Admin tạo được câu hỏi với title, description, difficulty, sample_input và sample_output.

            Admin cập nhật được nội dung câu hỏi khi phát hiện sai sót.

            User không phải Admin gọi API tạo/sửa câu hỏi phải nhận 403 Forbidden.

    US-10 [Admin]: Quản lý test case cho câu hỏi

        Mô tả: As an Admin, I want to manage visible and hidden test cases, so that submissions can be graded automatically and fairly.

        Acceptance Criteria:

            Admin thêm/sửa/xóa được test case theo từng question.

            Mỗi test case có input, expected_output, is_hidden và sort_order.

            API public/Coder không được trả expected_output của hidden test cases.

    US-11 [Admin]: Quản lý user và phân quyền

        Mô tả: As an Admin, I want to assign roles to users, so that each user can only perform actions suitable for their responsibility.

        Acceptance Criteria:

            Admin xem được danh sách user và role hiện tại.

            Admin đổi role user sang Admin, Coder hoặc Viewer.

            Hệ thống không cho user tự đổi role của chính mình qua API thường.

    US-12 [Admin]: Xem dashboard submission toàn hệ thống

        Mô tả: As an Admin, I want to view all submissions, so that I can monitor candidate activity and grading outcomes.

        Acceptance Criteria:

            Admin xem được danh sách submission của tất cả user.

            Admin có thể lọc theo question, user, language, status hoặc khoảng thời gian.

            Dashboard hiển thị đủ metadata nhưng cần mask dữ liệu nhạy cảm như password/token.

    US-13 [Viewer]: Xem kết quả Run/Submit trong session

        Mô tả: As a Viewer, I want to see run and submit results from the active session, so that I can understand whether the candidate's code works.

        Acceptance Criteria:

            Viewer nhận được event realtime khi Coder chạy hoặc submit code.

            Viewer thấy status, stdout/stderr được phép hiển thị, execution_time và memory_usage.

            Viewer không thể tự tạo submission hoặc gọi Run/Submit thay Coder.

    US-14 [Coder]: Nhận lỗi rõ ràng khi code runner gặp sự cố

        Mô tả: As a Coder, I want to receive a clear error when Judge0 is unavailable or times out, so that I know the problem is system-related and can retry later.

        Acceptance Criteria:

            Nếu Judge0 timeout hoặc connection refused, backend trả lỗi thân thiện thay vì crash.

            Submission thất bại do hệ thống được lưu với status phù hợp như judge_error hoặc system_error.

            Frontend hiển thị thông báo dễ hiểu và cho phép user retry khi phù hợp.
5. Danh sách 10 Edge Cases quan trọng (Kịch bản lỗi hệ thống)

Hệ thống cần kiểm soát chặt chẽ các tình huống biên sau:

    Vòng lặp vô hạn / Treo tài nguyên (while(true)): Code Coder bị TLE. Xử lý: Backend cấu hình cứng tham số cpu_time_limit (10s) và wall_time_limit (15s) khi gọi sang Judge0.

    Tấn công đệ quy tràn bộ nhớ (Fork Bomb): Người dùng cố tình chiếm dụng tài nguyên hệ thống container. Xử lý: Cấu hình giới hạn bộ nhớ tối đa memory_limit (256MB) trong sandbox của Judge0.

    Mã độc truy cập hệ thống: Coder chạy lệnh ls / hoặc cố gắng đọc file cấu hình hệ thống. Xử lý: Bản thân Judge0 chạy trên container isolated sandbox độc lập, tự hủy sau khi xong request. Chặn các system call nguy hiểm thông qua cấu hình Docker.

    Hạ tầng Judge0 đột ngột bị sập (Crash): Khi Coder bấm Run/Submit mà service Judge0 đang down. Xử lý: Áp dụng cơ chế Timeout kết nối, trả về thông báo thân thiện "Code runner is temporarily unavailable." thay vì làm sập (crash) toàn bộ hệ thống API Backend.

    Spam nút bấm gửi code liên tục: Coder click "Run" liên tục 50 lần/giây. Xử lý: Disable button ở Client ngay sau click đầu tiên; bổ sung Rate Limiting / Throttle ở API gateway.

    Spam sự kiện gõ phím (Realtime Spam): Coder gõ cực nhanh (100 ký tự/giây). Xử lý: Sử dụng kỹ thuật Debounce / Throttle ở phía Client, chỉ đóng gói và gửi payload update qua Socket sau mỗi khoảng lặng 300ms.

    Sự khác biệt về ký tự xuống dòng (Newline / Whitespace): Output của user có thêm dấu cách thừa hoặc xuống dòng kiểu \r\n thay vì \n. Xử lý: Backend thực hiện hàm chuẩn hóa (Normalize Output) bằng cách trim() khoảng trắng trước khi so sánh chuỗi kết quả.

    Token JWT hết hạn giữa chừng khi Socket đang kết nối: Ứng viên đang làm bài qua thời gian hết hạn token. Xử lý: Socket middleware kiểm tra và xác thực JWT định kỳ hoặc bắt sự kiện lỗi để tự động refresh kết nối ở client.

    Payload code snapshot quá lớn: Coder paste một file dữ liệu text dài hàng chục MB vào editor. Xử lý: Giới hạn dung lượng text đầu vào tối đa nhận diện từ phía API và trả lỗi Payload too large (413).

    Ngôn ngữ lập trình không được hỗ trợ hoặc bị tắt cấu hình: Client gửi yêu cầu với ID ngôn ngữ không hợp lệ. Xử lý: Backend map dữ liệu qua bảng Language Map, nếu không thấy thì trả lỗi "This language is not enabled.".

6. Risk List (Rủi ro, xác suất, ảnh hưởng và hướng giảm thiểu)

1. Judge0 self-hosted khó cấu hình hoặc không ổn định khi demo
   - Probability: Medium
   - Impact: High
   - Mitigation: Chuẩn bị tài liệu cấu hình Judge0 riêng, kiểm tra healthcheck trước demo, có mock Judge0 client tạm thời cho trường hợp môi trường lỗi.

2. Code người dùng tiêu tốn quá nhiều CPU/RAM làm chậm hệ thống
   - Probability: Medium
   - Impact: High
   - Mitigation: Cấu hình `cpu_time_limit`, `wall_time_limit`, `memory_limit`; thêm rate limit cho endpoint Run/Submit.

3. Hidden test case bị lộ qua API hoặc lịch sử submission
   - Probability: Medium
   - Impact: High
   - Mitigation: Tách API Admin và Coder rõ ràng, mask `expected_output`, input và output chi tiết của hidden test case trong response cho Coder/Viewer.

4. Realtime Socket.io bị spam event khi Coder gõ nhanh
   - Probability: High
   - Impact: Medium
   - Mitigation: Debounce/throttle client khoảng 300ms, kiểm tra quyền socket theo session, giới hạn kích thước payload code update.

5. Join code bị đoán hoặc bị chia sẻ ngoài ý muốn
   - Probability: Medium
   - Impact: Medium
   - Mitigation: Sinh join code ngẫu nhiên đủ dài, chỉ cho join session còn active, có thể thêm expired time hoặc cơ chế end session.

6. JWT hết hạn giữa lúc user đang làm bài hoặc socket vẫn mở
   - Probability: Medium
   - Impact: Medium
   - Mitigation: Client xử lý lỗi auth và yêu cầu login lại; socket middleware xác thực khi connect/reconnect.

7. Database lưu code snapshot quá lớn làm tăng dung lượng nhanh
   - Probability: Medium
   - Impact: Medium
   - Mitigation: Giới hạn kích thước source code/stdin, lưu metadata cần thiết, sau MVP cân nhắc object storage cho snapshot lớn.

8. So sánh output sai do khác newline/space giữa các ngôn ngữ
   - Probability: High
   - Impact: Medium
   - Mitigation: Normalize output trước khi so sánh, định nghĩa rõ mode so sánh strict hay trim trailing whitespace.

9. Thiếu test tự động cho RBAC và grading dẫn đến lỗi bảo mật
   - Probability: Medium
   - Impact: High
   - Mitigation: Ưu tiên test API cho role Admin/Coder/Viewer, test case hidden leakage và endpoint Submit/Run.

10. Scope MVP quá rộng so với thời gian tuần 3-8
    - Probability: High
    - Impact: High
    - Mitigation: Chốt P0 demo trước: Run code + lưu submission + hiển thị output; realtime và grading có thể triển khai P1 theo tiến độ.

7. Repo hiện tại đã có gì

Repo hiện tại `DOCKER_TEST` đã có nền tảng phù hợp để phát triển WEB IDE:

1. Frontend React/Vite nằm trong `frontend/`, hiện có trang Auth và các component UI cơ bản.
2. Backend Express nằm trong `backend/src/`, đang tổ chức theo module/service/repository cho domain auth.
3. Authentication đã có đăng ký, đăng nhập JWT và endpoint lấy thông tin user hiện tại.
4. PostgreSQL đã được cấu hình qua `backend/src/config/db.js` và Docker Compose.
5. Docker Compose đã có frontend, API và PostgreSQL để chạy môi trường demo.
6. Middleware dùng chung đã có logger, authenticate token và error handler.
7. Tài liệu nền đã có `online-code-editor-prep.md`, `mvp-backlog.md`, `judge0-integration.md` và `week-3-to-8-plan.md`.

Những phần repo chưa có và sẽ thuộc các tuần tiếp theo:

1. Chưa có role/RBAC đầy đủ cho Admin, Coder, Viewer.
2. Chưa có module questions, test-cases, submissions, sessions.
3. Chưa tích hợp Judge0 client thật.
4. Chưa có trang code editor.
5. Chưa có Socket.io realtime Coder -> Viewer.

8. Flow demo P0 đã chốt

Flow P0 ưu tiên để chứng minh dự án khả thi:

```text
Coder đăng nhập
-> chọn/ngồi tại màn Code Editor
-> chọn ngôn ngữ và nhập source code/stdin
-> bấm Run
-> Frontend gọi Backend POST /api/submissions/run
-> Backend validate JWT, role và payload
-> Backend gọi Judge0 với giới hạn CPU/RAM/time
-> Judge0 trả stdout/stderr/status/time/memory
-> Backend lưu submission vào PostgreSQL
-> Frontend hiển thị output/error/status cho Coder
```
