# Learnix

## Deploy Link: https://learnix-rho.vercel.app/

## Run Locally

### Backend

```
npm install
npm run dev
```

.env:

```
PORT=5000
MONGO_URI=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=....
```

### Frontend

```
npm install
npm run dev
```

.env:

```
VITE_API_BASE_URL=http://localhost:5000
```

## 👩‍💻 Developer Guide

### 1. Project Structure

- **Backend (API server):** thư mục `server/` – Node.js + Express, MongoDB (Mongoose), JWT Auth + Google OAuth (Passport).
- **Frontend (SPA):** thư mục `client/` – React + Vite + TypeScript + Tailwind CSS.
- **Root:** các file cấu hình chung như `jest.config.js`, `babel.config.js`, tài liệu và script tiện ích.

### 2. Setup Guide (Local Development)

1. **Chuẩn bị .env**
     - Backend: copy `server/.env.example` → `server/.env` và điền đầy đủ các biến như phần **Backend .env** ở trên.
     - Frontend: copy `client/.env.example` → `client/.env` và thiết lập `VITE_API_BASE_URL` (ví dụ: `http://localhost:5000`).

2. **Cài đặt & chạy Backend**

     ```bash
     cd server
     npm install
     npm run dev
     ```

     Mặc định API chạy tại `http://localhost:5000` (hoặc theo biến `PORT` trong `.env`).

3. **Cài đặt & chạy Frontend**

     ```bash
     cd client
     npm install
     npm run dev
     ```

     Vite sẽ hiển thị địa chỉ ứng dụng (thường là `http://localhost:5173`).

4. **Kiểm thử (tùy chọn)**
     - Backend API tests: sử dụng Jest + Supertest (xem script trong `server/package.json`).
     - Frontend tests: chạy Jest/Testing Library từ thư mục `client/` (xem script trong `client/package.json`).

---

## 🧱 System Architecture

- **Client (Frontend):**
    - SPA React/Vite tại `client/`.
    - Giao tiếp với Backend qua REST API sử dụng Axios (các service: `authService.ts`, `courseService.ts`, `quizService.ts`, ...).
- **API Server (Backend):**
    - Express app trong `server/index.js` / `server/server.js`.
    - Các route chính: `/api/auth`, `/api/user`, `/api/courses`, `/api/enrollments`, `/api/student`, `/api/quizzes`.
    - Xác thực JWT + middleware phân quyền (file `middleware/authMiddleware.js`), Google OAuth cấu hình trong `config/passport.js`.
- **Database:**
    - MongoDB, ánh xạ qua Mongoose models trong `server/models/`.
- **Code Execution Service:**
    - Chạy và chấm code cho bài tập lập trình (file `utils/codeExecutor.js`, model `ProgrammingExercise`, `CodeSubmission`).

Luồng chính:

1. Trình duyệt tải SPA từ Frontend.
2. Frontend gọi REST API (base: `http://localhost:5000/api`) để đăng nhập, lấy khóa học, quiz, bài tập lập trình, v.v.
3. Backend xử lý logic, truy vấn MongoDB và trả JSON về cho client.

---

## 🗄️ Database Design (MongoDB)

Các collection chính (Mongoose models trong `server/models/`):

- **User:** thông tin tài khoản, email, mật khẩu (hash), role (`student`, `instructor`, `admin`), trạng thái khóa.
- **Course:** thông tin khóa học, mô tả, danh mục, tag, trạng thái publish, instructor phụ trách.
- **Lesson:** thuộc về một `Course`, chứa nội dung và thứ tự bài học.
- **Enrollment:** liên kết `User` (student) với `Course`, trạng thái đăng ký, lịch sử tham gia.
- **Progress:** lưu tiến độ học tập của học viên theo bài học/khóa.
- **Quiz:** thông tin một bài quiz, thuộc về khóa học/bài học (tùy cấu hình trong controller/model).
- **Question:** câu hỏi + đáp án cho từng quiz.
- **Submission:** kết quả làm quiz (điểm, câu trả lời của học viên).
- **ProgrammingExercise:** mô tả bài tập lập trình, ngôn ngữ, test cases.
- **CodeSubmission:** bài nộp code của học viên, kết quả chạy test.
- **Review (nếu sử dụng):** đánh giá khóa học từ học viên.

Các quan hệ logic (ở mức khái niệm):

- 1 **User (student)** ↔ nhiều **Enrollment** ↔ nhiều **Course**.
- 1 **Course** ↔ nhiều **Lesson**, **Quiz**, **ProgrammingExercise**.
- 1 **Lesson** ↔ nhiều **ProgrammingExercise**.
- 1 **Quiz** ↔ nhiều **Question** ↔ nhiều **Submission** từ các học viên khác nhau.

---

## 🌐 API Endpoints Overview

**Base URL (local):** `http://localhost:5000/api`

### Auth – `/auth`

- `POST /auth/register` – Đăng ký tài khoản mới.
- `POST /auth/login` – Đăng nhập bằng email/password.
- `POST /auth/forgot-password` – Yêu cầu đặt lại mật khẩu.
- `POST /auth/reset-password` – Đặt mật khẩu mới.
- `GET /auth/google` – Bắt đầu flow Google OAuth.
- `GET /auth/google/callback` – Google callback, trả token.
- `POST /auth/refresh` – Xin access token mới từ refresh token.

### User – `/user` (đa số cần JWT, một số route chỉ dành cho admin)

- `GET /user/profile` – Lấy thông tin profile người dùng hiện tại.
- `PUT /user/profile` – Cập nhật profile.
- `GET /user/stats` – Thống kê hệ thống (admin).
- `GET /user/all` – Danh sách toàn bộ user (admin).
- `PUT /user/role` – Cập nhật role user (admin).
- `PUT /user/lock` – Khóa/mở khóa tài khoản (admin).

### Courses – `/courses`

- `GET /courses` – Lấy danh sách khóa học (public).
- `GET /courses/categories` – Lấy danh mục.
- `GET /courses/tags/trending` – Lấy tag trending.
- `GET /courses/search` – Tìm kiếm khóa học.
- `GET /courses/:courseId/suggested` – Khóa học gợi ý liên quan.
- `GET /courses/:id` – Chi tiết khóa học (có thể kiểm tra đã enroll hay chưa).
- `POST /courses` – Tạo khóa học mới (instructor/admin).
- `PUT /courses/:id` – Cập nhật khóa học (instructor/admin).
- `DELETE /courses/:id` – Xóa khóa học (instructor/admin).
- `PATCH /courses/:id/status` – Cập nhật trạng thái khóa học.
- `PATCH /courses/:id/publish` / `/unpublish` – Publish/Unpublish khóa học.
- `PATCH /courses/:id/tags/add` / `/remove` – Quản lý tags.
- `PATCH /courses/:id/assign-instructor` – Gán instructor (admin).

### Lessons – `/courses/:courseId/lessons`

- `GET /courses/:courseId/lessons` – Danh sách bài học cho học viên.
- `GET /courses/:courseId/lessons/manage/all` – Danh sách quản lý cho instructor/admin.
- `PUT /courses/:courseId/lessons/reorder` – Sắp xếp lại thứ tự bài học.
- `POST /courses/:courseId/lessons` – Tạo bài học mới (instructor/admin).
- `GET /courses/:courseId/lessons/:lessonId` – Lấy chi tiết bài học.
- `PUT /courses/:courseId/lessons/:lessonId` – Cập nhật bài học.
- `DELETE /courses/:courseId/lessons/:lessonId` – Xóa bài học.
- `PUT /courses/:courseId/lessons/:lessonId/progress` – Cập nhật tiến độ học (student).

### Programming Exercises – `/courses/:courseId/lessons/:lessonId/exercises`

- `POST /.../exercises` – Tạo bài tập lập trình (instructor/admin).
- `GET /.../exercises` – Lấy tất cả bài tập của bài học.
- `GET /.../exercises/:exerciseId` – Lấy chi tiết bài tập.
- `PUT /.../exercises/:exerciseId` – Cập nhật bài tập.
- `DELETE /.../exercises/:exerciseId` – Xóa bài tập.
- `POST /.../exercises/:exerciseId/run` – Chạy code với test cases hiển thị.
- `POST /.../exercises/:exerciseId/submit` – Nộp bài, chấm full test.
- `GET /.../exercises/:exerciseId/submissions` – Lịch sử bài nộp.

### Quizzes – `/quizzes`

- `GET /quizzes?course_id=...` – Danh sách quiz (lọc theo khóa học).
- `GET /quizzes/my-submissions` – Bài làm quiz của user hiện tại.
- `GET /quizzes/:id` – Chi tiết quiz để làm bài.
- `POST /quizzes/:quizId/submit` – Nộp bài quiz.
- `POST /quizzes` – Tạo quiz (instructor/admin).
- `PUT /quizzes/:id` – Cập nhật quiz.
- `DELETE /quizzes/:id` – Xóa quiz.
- `POST /quizzes/generate-mcq` – Sinh câu hỏi trắc nghiệm từ nội dung (AI, instructor/admin).

### Enrollments – `/enrollments`

- `GET /enrollments/my-courses` – Danh sách khóa học đã đăng ký (student).
- `POST /enrollments/courses/:courseId/enroll` – Đăng ký học.
- `DELETE /enrollments/courses/:courseId/enroll` – Hủy đăng ký.

### Student – `/student`

- `GET /student/dashboard` – Thông tin tổng quan dashboard học viên.
- `GET /student/budget` – Thông tin ngân sách/credit học tập (nếu áp dụng).

> Lưu ý: nhiều endpoint yêu cầu header `Authorization: Bearer <access_token>` và role phù hợp (`student`, `instructor`, `admin`).

---

## 📖 User Guide

### 1. Đăng ký & Đăng nhập

- Người dùng có thể đăng ký tài khoản mới bằng email/password hoặc đăng nhập nhanh qua Google.
- Sau khi đăng nhập thành công, hệ thống cấp **access token** và **refresh token** (được frontend quản lý tự động).

### 2. Khám phá & Đăng ký khóa học

- Vào trang **Courses** để xem danh sách khóa học, lọc theo danh mục hoặc tìm kiếm.
- Vào trang chi tiết khóa học để xem mô tả, nội dung chính, instructor.
- Nhấn **Enroll** để đăng ký tham gia khóa học (nếu được cấu hình cho phép).

### 3. Học bài & Làm bài tập

- Trong trang **Learn** của mỗi khóa học, học viên xem nội dung từng **Lesson**, hệ thống tự lưu **Progress**.
- Với khóa học có **Programming Exercises**, học viên có thể viết code, **Run** để thử, sau đó **Submit** để chấm điểm.
- Với khóa học có **Quiz**, học viên vào trang quiz, làm bài và nộp để nhận điểm.

### 4. Dashboard & Quản lý tài khoản

- **Student Dashboard:** xem tiến độ học tập, khóa học đã đăng ký, kết quả quiz/bài tập.
- **Instructor Dashboard:** quản lý khóa học, bài học, quiz, bài tập lập trình, xem thống kê học viên.
- **Admin Dashboard:** quản lý user, phân quyền, khóa/mở khóa tài khoản, xem thống kê hệ thống.
- Người dùng có thể chỉnh sửa thông tin cá nhân trong **Profile Page**.

---

Dưới đây là phiên bản **đầy đủ – rõ ràng – ngắn gọn** cho phần **Auth Overview**, có bổ sung giải thích chi tiết nhưng vẫn gọn:

---

## 🛠️ Tooling & Quality Overview

Dự án được xây dựng với các tiêu chuẩn chất lượng cao:

- **Linter & Formatter:** Sử dụng **Prettier** để định dạng mã nguồn tự động. **ESLint** cho kiểm tra code style FE (cài đặt tại `client/`, chạy: `npm run lint`).
- **Unit & API Testing:** Sử dụng **Jest** và **Supertest** để kiểm thử tích hợp các endpoint API Backend và các hàm tiện ích của Client.
- **Commit Quality:** Sử dụng **lint-staged** để tự động chạy Prettier trước khi commit.

### Hướng dẫn kiểm tra code style
1. `cd client`
2. Cài ESLint:
   ```
   npm install eslint --save-dev
   npx eslint --init # chọn React, JS, browser, style (ấn Enter theo hướng dẫn)
   ```
3. Kiểm tra code:
   ```
   npm run lint
   ```

---

## 🖥️ Dashboard & Layout Architecture

Hệ thống thiết kế và Dashboard được xây dựng với khả năng tái sử dụng và phân quyền[cite: 7].

- **Layout Components:** Sử dụng Tailwind CSS để tạo các thành phần layout tái sử dụng như **AppShell** (Header, Sidebar, Footer), **Card**, và **Button**.
- **Role-Based UI:** Dashboard được thiết kế để thích ứng với vai trò của người dùng (Student, Instructor, Admin), chỉ hiển thị các widget và chức năng có liên quan (ví dụ: Student thấy tiến độ, Instructor thấy phân tích học viên).

---

## 🔐 Auth Overview

- **Access Token**
    - JWT sống ngắn (1 giờ).
    - Lưu trong `localStogare` hoặc memory (tùy cấu hình).
    - Gửi kèm mỗi request qua header `Authorization: Bearer <token>`.

- **Refresh Token**
    - JWT sống dài hơn (7 ngày).
    - Lưu trong `httpOnly cookie` hoặc `localStogare` tùy thiết kế security.
    - Dùng để xin **access token mới** khi access token hết hạn mà không cần đăng nhập lại.

- **Roles**
    - Mỗi user có một role cố định:
        - `student` — người học
        - `instructor` — giảng viên
        - `admin` — quản trị hệ thống

    - Backend sẽ ghi role trong payload của JWT để client biết quyền.

- **Middleware Backend**
    - **`protect`**
        - Kiểm tra access token hợp lệ.
        - Nếu token hết hạn → client sẽ dùng refresh token để lấy token mới.
        - Chặn luôn request nếu không có token.

    - **`restrictTo(role)`**
        - Chỉ cho phép truy cập route nếu user có đúng vai trò.
        - Ví dụ:
            - `restrictTo("admin")` → chỉ admin truy cập.
            - `restrictTo("instructor", "admin")` → cho 2 role này.

- **Flow tổng quát**
    1. Người dùng login (password hoặc Google OAuth).
    2. Backend trả về _access token_ và _refresh token_.
    3. Axios interceptor tự gắn access token vào request.
    4. Khi access token hết hạn → axios tự gửi request refresh → lấy token mới → retry request.
    5. Logout sẽ xoá cả hai token.

---

## Google OAuth Setup

1. Tạo OAuth Client ở Google Cloud.
2. Thêm redirect URI:

```
BASE_URL/api/auth/google/callback
```

3. Đưa `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` vào `.env`.
4. Passport config:

```
callbackURL = /api/auth/google/callback
```

---

## Decisions & Trade-offs

- **JWT (Access + Refresh):**
    - ✔️ Phù hợp SPA, dễ scale, không cần session.
    - ⚠️ Cần tự xử lý refresh, dễ lỗi nếu quản lý token sai.

- **Axios + Interceptor:**
    - ✔️ Tự attach token, tự refresh khi 401 → tiện lợi.
    - ⚠️ Interceptor phức tạp hơn, dễ loop nếu refresh lỗi.

- **Google OAuth:**
    - ✔️ Đăng nhập nhanh, user không cần nhớ mật khẩu.
    - ⚠️ Phụ thuộc Google, cần cấu hình redirect chuẩn.

---

## Example Accounts

| Email                | Password      | Role       |
| -------------------- | ------------- | ---------- |
| user@gmail.com       | User@123456789| student    |
| admin@gmail.com      | Admin@123     | admin      |
| instructor@gmail.com | Instructor@123| instructor |
