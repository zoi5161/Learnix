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

---

Dưới đây là phiên bản **đầy đủ – rõ ràng – ngắn gọn** cho phần **Auth Overview**, có bổ sung giải thích chi tiết nhưng vẫn gọn:

---

## 🔐 Auth Overview

* **Access Token**

  * JWT sống ngắn (1 giờ).
  * Lưu trong `localStogare` hoặc memory (tùy cấu hình).
  * Gửi kèm mỗi request qua header `Authorization: Bearer <token>`.

* **Refresh Token**

  * JWT sống dài hơn (7 ngày).
  * Lưu trong `httpOnly cookie` hoặc `localStogare` tùy thiết kế security.
  * Dùng để xin **access token mới** khi access token hết hạn mà không cần đăng nhập lại.

* **Roles**

  * Mỗi user có một role cố định:

    * `student` — người học
    * `instructor` — giảng viên
    * `admin` — quản trị hệ thống
  * Backend sẽ ghi role trong payload của JWT để client biết quyền.

* **Middleware Backend**

  * **`protect`**

    * Kiểm tra access token hợp lệ.
    * Nếu token hết hạn → client sẽ dùng refresh token để lấy token mới.
    * Chặn luôn request nếu không có token.

  * **`restrictTo(role)`**

    * Chỉ cho phép truy cập route nếu user có đúng vai trò.
    * Ví dụ:

      * `restrictTo("admin")` → chỉ admin truy cập.
      * `restrictTo("instructor", "admin")` → cho 2 role này.

* **Flow tổng quát**

  1. Người dùng login (password hoặc Google OAuth).
  2. Backend trả về *access token* và *refresh token*.
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

* **JWT (Access + Refresh):**

  * ✔️ Phù hợp SPA, dễ scale, không cần session.
  * ⚠️ Cần tự xử lý refresh, dễ lỗi nếu quản lý token sai.

* **Axios + Interceptor:**

  * ✔️ Tự attach token, tự refresh khi 401 → tiện lợi.
  * ⚠️ Interceptor phức tạp hơn, dễ loop nếu refresh lỗi.

* **Google OAuth:**

  * ✔️ Đăng nhập nhanh, user không cần nhớ mật khẩu.
  * ⚠️ Phụ thuộc Google, cần cấu hình redirect chuẩn.

---
## Example Accounts

| Email              | Password        | Role       |
|--------------------|-----------------|------------|
| user@gmail.com     | User123456789   | student    |
| admin@gmail.com    | Admin123        | admin      |
| instructor@gmail.com | Instructor123 | instructor |



