# Learnix - Nền tảng học tập trực tuyến

> Hệ thống quản lý khóa học (LMS) với tính năng quiz, bài tập lập trình, và AI hỗ trợ tạo câu hỏi.

**Demo:** https://learnix-rho.vercel.app/

---

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Tài khoản demo](#-tài-khoản-demo)

---

## ✨ Tính năng chính

### Dành cho Học viên (Student)
- 📚 Xem và đăng ký khóa học
- 🎥 Học bài với video, text, PDF
- 💻 Làm bài tập lập trình (Python, JavaScript) với trình soạn thảo code tích hợp
- 📝 Làm quiz và xem kết quả
- 📊 Theo dõi tiến độ học tập
- 🏆 Hệ thống điểm và ngân sách (budget/credits)

### Dành cho Giảng viên (Instructor)
- ➕ Tạo và quản lý khóa học
- 📖 Tạo bài học với nhiều loại nội dung (video, text, PDF)
- 🤖 Tạo quiz tự động bằng AI từ nội dung bài học
- 📝 Tạo quiz thủ công với nhiều câu hỏi
- 💻 Tạo bài tập lập trình với test cases
- 📈 Xem thống kê học viên và kết quả bài làm
- ✅ Gửi khóa học để admin duyệt

### Dành cho Admin
- 👥 Quản lý người dùng (phân quyền, khóa/mở tài khoản)
- ✅ Duyệt khóa học (approve/reject)
- 📊 Xem thống kê tổng quan hệ thống
- 🔧 Quản lý toàn bộ nội dung

---

## 🛠 Công nghệ sử dụng

### Backend
- **Node.js** + **Express** - Framework API server
- **MongoDB** + **Mongoose** - Database NoSQL
- **JWT** - Authentication (Access Token + Refresh Token)
- **Google OAuth 2.0** - Đăng nhập bằng Google
- **Bcrypt** - Mã hóa mật khẩu
- **Google Generative AI** - Tạo câu hỏi quiz tự động
- **Nodemailer** - Gửi email reset password

### Frontend
- **React 19** + **TypeScript** - UI framework
- **Vite** - Build tool
- **React Router v7** - Routing
- **Axios** - HTTP client
- **Monaco Editor** - Code editor cho bài tập lập trình
- **Recharts** - Biểu đồ thống kê
- **Tailwind CSS** - Styling
- **JWT Decode** - Decode JWT tokens

---

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js** >= 16.x
- **MongoDB** >= 5.x
- **npm** hoặc **yarn**

### 1. Clone project

```bash
git clone <repository-url>
cd Learnix
```

### 2. Cài đặt Backend

```bash
cd server
npm install
```

Tạo file `.env` trong thư mục `server/`:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/learnix
ACCESS_TOKEN_SECRET=your_access_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key (optional - cho AI quiz generator)
```

Chạy server:

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:8000`

### 3. Cài đặt Frontend

```bash
cd client
npm install
```

Tạo file `.env` trong thư mục `client/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### 4. Seed dữ liệu mẫu (Tùy chọn)

```bash
cd server
node config/seed_db.js
```

---

## 📁 Cấu trúc dự án

```
Learnix/
├── server/                    # Backend API
│   ├── config/               # Cấu hình DB, Passport, Seed data
│   ├── controllers/          # Xử lý logic nghiệp vụ
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── services/            # Business logic layer
│   ├── middleware/          # Auth middleware
│   ├── utils/               # Utilities (JWT, Code executor)
│   ├── __tests__/           # API tests
│   └── server.js            # Entry point
│
├── client/                   # Frontend React
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   │   ├── Auth/       # Login, Register, ForgotPassword
│   │   │   ├── Courses/    # Course List, Detail, Learn
│   │   │   ├── Dashboard/  # Student/Instructor/Admin dashboards
│   │   │   ├── Quizzes/    # Quiz management & taking
│   │   │   └── Profile/    # User profile
│   │   ├── services/       # API service calls
│   │   ├── utils/          # Utilities (Auth token)
│   │   ├── types/          # TypeScript types
│   │   ├── routes/         # Route configuration
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
│
└── README.md               # This file
```

---

## 🗄 Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password_hash: String,
  role: enum ['student', 'instructor', 'admin'],
  googleId: String (optional),
  isLocked: Boolean,
  budget: Number,           // Ngân sách học tập
  bonus_credits: Number,    // Điểm thưởng
  timestamps: true
}
```

### Course
```javascript
{
  instructor_id: ObjectId -> User,
  title: String,
  description: String,
  summary: String,
  level: enum ['beginner', 'intermediate', 'advanced'],
  status: enum ['draft', 'pending', 'published', 'rejected'],
  category: String,
  tags: [String],
  thumbnail: String,
  price: Number,
  is_premium: Boolean,
  timestamps: true
}
```

### Lesson
```javascript
{
  course_id: ObjectId -> Course,
  title: String,
  content_type: enum ['video', 'text', 'pdf', 'quiz', 'assignment'],
  content: String,          // URL hoặc text content
  description: String,
  duration: Number,         // Phút
  is_free: Boolean,
  order: Number,           // Thứ tự bài học
  timestamps: true
}
```

### Enrollment
```javascript
{
  student_id: ObjectId -> User,
  course_id: ObjectId -> Course,
  status: enum ['enrolled', 'completed', 'dropped', 'suspended'],
  timestamps: true
}
```

### Progress
```javascript
{
  student_id: ObjectId -> User,
  course_id: ObjectId -> Course,
  lesson_id: ObjectId -> Lesson,
  status: enum ['not_started', 'in_progress', 'completed'],
  completion_percentage: Number (0-100),
  time_spent: Number,      // Giây
  last_accessed_at: Date,
  completed_at: Date,
  notes: String,
  timestamps: true
}
```

### Quiz
```javascript
{
  course_id: ObjectId -> Course,
  lesson_id: ObjectId -> Lesson,
  title: String,
  description: String,
  time_limit: Number,      // Phút (0 = không giới hạn)
  attempts_allowed: Number,
  passing_score: Number,   // Điểm đậu (0-100)
  is_active: Boolean,
  timestamps: true
}
```

### Question
```javascript
{
  quiz_id: ObjectId -> Quiz,
  question_text: String,
  question_type: enum ['multiple_choice', 'true_false'],
  options: [String],       // Các đáp án
  correct_answer: Number,  // Index của đáp án đúng
  points: Number,
  explanation: String,     // Giải thích đáp án
  timestamps: true
}
```

### Submission
```javascript
{
  student_id: ObjectId -> User,
  quiz_id: ObjectId -> Quiz,
  answers: [Number],       // Mảng index các đáp án đã chọn
  score: Number,
  max_score: Number,
  passed: Boolean,
  time_taken: Number,      // Giây
  submitted_at: Date,
  timestamps: true
}
```

### ProgrammingExercise
```javascript
{
  lesson_id: ObjectId -> Lesson,
  title: String,
  description: String,
  starter_code: {
    python: String,
    javascript: String
  },
  test_cases: [{
    input: String,
    expected_output: String,
    is_hidden: Boolean,
    points: Number,
    description: String
  }],
  languages: ['python', 'javascript'],
  difficulty: enum ['easy', 'medium', 'hard'],
  time_limit: Number,      // Giây
  memory_limit: Number,    // MB
  function_name: String,
  input_format: enum ['json', 'space_separated', 'line_separated'],
  timestamps: true
}
```

### CodeSubmission
```javascript
{
  student_id: ObjectId -> User,
  exercise_id: ObjectId -> ProgrammingExercise,
  code: String,
  language: enum ['python', 'javascript'],
  status: enum ['pending', 'running', 'passed', 'failed', 'error'],
  test_results: [{
    passed: Boolean,
    input: String,
    expected: String,
    actual: String,
    error: String,
    points: Number
  }],
  score: Number,
  max_score: Number,
  submitted_at: Date,
  timestamps: true
}
```

---

## 🔌 API Endpoints

**Base URL:** `http://localhost:8000/api`

### 🔐 Authentication (`/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/forgot-password` | Quên mật khẩu | ❌ |
| POST | `/auth/reset-password` | Đặt lại mật khẩu | ❌ |
| GET | `/auth/google` | Đăng nhập Google (redirect) | ❌ |
| GET | `/auth/google/callback` | Google OAuth callback | ❌ |
| POST | `/auth/refresh` | Làm mới access token | ❌ |

### 👤 User (`/user`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/user/profile` | Xem profile | ✅ | All |
| PUT | `/user/profile` | Cập nhật profile | ✅ | All |
| GET | `/user/stats` | Thống kê hệ thống | ✅ | Admin |
| GET | `/user/all` | Danh sách user | ✅ | Admin |
| PUT | `/user/role` | Đổi role user | ✅ | Admin |
| PUT | `/user/lock` | Khóa/mở khóa user | ✅ | Admin |

### 📚 Courses (`/courses`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/courses` | Danh sách khóa học | ❌ | Public |
| GET | `/courses/:id` | Chi tiết khóa học | ❌ | Public |
| GET | `/courses/categories` | Danh mục khóa học | ❌ | Public |
| GET | `/courses/tags/trending` | Tags phổ biến | ❌ | Public |
| GET | `/courses/search` | Tìm kiếm khóa học | ❌ | Public |
| GET | `/courses/:id/suggested` | Khóa học gợi ý | ❌ | Public |
| POST | `/courses` | Tạo khóa học | ✅ | Instructor, Admin |
| PUT | `/courses/:id` | Sửa khóa học | ✅ | Instructor, Admin |
| DELETE | `/courses/:id` | Xóa khóa học | ✅ | Instructor, Admin |
| PATCH | `/courses/:id/status` | Đổi status (approve/reject) | ✅ | Instructor, Admin |
| PATCH | `/courses/:id/publish` | Publish khóa học | ✅ | Instructor, Admin |
| PATCH | `/courses/:id/unpublish` | Unpublish khóa học | ✅ | Instructor, Admin |

### 📖 Lessons (`/courses/:courseId/lessons`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/courses/:courseId/lessons` | Danh sách bài học (student view) | ✅ | Student |
| GET | `/courses/:courseId/lessons/manage/all` | Danh sách bài học (manage view) | ✅ | Instructor, Admin |
| GET | `/courses/:courseId/lessons/:lessonId` | Chi tiết bài học | ✅ | All |
| POST | `/courses/:courseId/lessons` | Tạo bài học | ✅ | Instructor, Admin |
| PUT | `/courses/:courseId/lessons/:lessonId` | Sửa bài học | ✅ | Instructor, Admin |
| DELETE | `/courses/:courseId/lessons/:lessonId` | Xóa bài học | ✅ | Instructor, Admin |
| PUT | `/courses/:courseId/lessons/reorder` | Sắp xếp bài học | ✅ | Instructor, Admin |
| PUT | `/courses/:courseId/lessons/:lessonId/progress` | Cập nhật tiến độ | ✅ | Student |

### 💻 Programming Exercises

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/courses/:courseId/lessons/:lessonId/exercises` | Danh sách bài tập | ✅ | All |
| GET | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId` | Chi tiết bài tập | ✅ | All |
| POST | `/courses/:courseId/lessons/:lessonId/exercises` | Tạo bài tập | ✅ | Instructor, Admin |
| PUT | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId` | Sửa bài tập | ✅ | Instructor, Admin |
| DELETE | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId` | Xóa bài tập | ✅ | Instructor, Admin |
| POST | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId/run` | Chạy thử code | ✅ | Student |
| POST | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId/submit` | Nộp bài | ✅ | Student |
| GET | `/courses/:courseId/lessons/:lessonId/exercises/:exerciseId/submissions` | Lịch sử nộp bài | ✅ | Student |

### 📝 Quizzes (`/quizzes`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/quizzes?course_id=...&lesson_id=...` | Danh sách quiz | ✅ | All |
| GET | `/quizzes/:id` | Chi tiết quiz (để làm bài) | ✅ | Student |
| GET | `/quizzes/my-submissions` | Lịch sử làm quiz | ✅ | Student |
| POST | `/quizzes/:quizId/submit` | Nộp bài quiz | ✅ | Student |
| POST | `/quizzes` | Tạo quiz | ✅ | Instructor, Admin |
| PUT | `/quizzes/:id` | Sửa quiz | ✅ | Instructor, Admin |
| DELETE | `/quizzes/:id` | Xóa quiz | ✅ | Instructor, Admin |
| GET | `/quizzes/:id/submissions` | Xem bài làm của học viên | ✅ | Instructor, Admin |
| GET | `/quizzes/:id/stats` | Thống kê quiz | ✅ | Instructor, Admin |
| POST | `/quizzes/generate-mcq` | Tạo quiz bằng AI | ✅ | Instructor, Admin |

### 🎓 Enrollments (`/enrollments`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/enrollments/my-courses` | Khóa học đã đăng ký | ✅ | Student |
| POST | `/enrollments/courses/:courseId/enroll` | Đăng ký khóa học | ✅ | Student |
| DELETE | `/enrollments/courses/:courseId/enroll` | Hủy đăng ký | ✅ | Student |

### 📊 Student (`/student`)

| Method | Endpoint | Mô tả | Auth | Role |
|--------|----------|-------|------|------|
| GET | `/student/dashboard` | Dashboard học viên | ✅ | Student |
| GET | `/student/budget` | Ngân sách học tập | ✅ | Student |

---

## 📖 Hướng dẫn sử dụng

### Đăng ký và Đăng nhập

1. **Đăng ký tài khoản:**
   - Vào trang chủ → Nhấn "Đăng ký"
   - Điền thông tin (tên, email, mật khẩu)
   - Hoặc đăng nhập nhanh bằng Google

2. **Đăng nhập:**
   - Nhập email/password
   - Hoặc dùng nút "Sign in with Google"
   - Hệ thống tự động lưu JWT token

### Dành cho Học viên (Student)

1. **Khám phá khóa học:**
   - Xem danh sách khóa học tại trang "Courses"
   - Lọc theo category, level, tags
   - Tìm kiếm theo tên khóa học

2. **Đăng ký khóa học:**
   - Vào trang chi tiết khóa học
   - Nhấn nút "Enroll" để đăng ký
   - Sau khi đăng ký, vào "Dashboard" để xem khóa học của mình

3. **Học bài:**
   - Vào "My Courses" → Chọn khóa học → "Start Learning"
   - Xem nội dung bài học (video/text/PDF)
   - Nhấn "Mark as Complete" khi hoàn thành

4. **Làm Quiz:**
   - Quiz xuất hiện sau khi hoàn thành bài học
   - Đọc câu hỏi và chọn đáp án
   - Nhấn "Submit" để nộp bài
   - Xem điểm và đáp án đúng

5. **Làm bài tập lập trình:**
   - Vào bài học có bài tập code
   - Viết code trong Monaco Editor
   - Nhấn "Run" để test với các test case hiển thị
   - Nhấn "Submit" để chấm điểm với tất cả test cases

### Dành cho Giảng viên (Instructor)

1. **Tạo khóa học:**
   - Dashboard → "Course Management" → "Create Course"
   - Điền thông tin (tiêu đề, mô tả, category, level, tags)
   - Khóa học mới tạo sẽ ở trạng thái "Draft"

2. **Thêm bài học:**
   - Vào khóa học → "Manage Lessons"
   - Nhấn "Add Lesson"
   - Chọn loại nội dung (Video/Text/PDF)
   - Điền link video YouTube hoặc nội dung text
   - Sắp xếp thứ tự bài học

3. **Tạo Quiz:**
   - Có 2 cách:
     - **Thủ công:** Dashboard → "Quiz Management" → "Create Quiz" → Thêm từng câu hỏi
     - **AI:** Dashboard → "AI Quiz Generator" → Paste nội dung bài học → AI tự tạo câu hỏi

4. **Tạo bài tập lập trình:**
   - Vào bài học → "Add Programming Exercise"
   - Viết đề bài, starter code
   - Thêm test cases (input → expected output)
   - Chọn ngôn ngữ (Python/JavaScript)

5. **Gửi khóa học để duyệt:**
   - Vào "My Courses" → Chọn khóa học (status = Draft)
   - Nhấn "Submit for Review"
   - Đợi admin approve
   - Sau khi approve, khóa học sẽ hiển thị public

6. **Xem thống kê:**
   - Vào Dashboard → "Course Statistics"
   - Xem số học viên, kết quả quiz, bài tập code

### Dành cho Admin

1. **Quản lý người dùng:**
   - Dashboard → "User Management"
   - Xem danh sách tất cả user
   - Đổi role (Student ↔ Instructor ↔ Admin)
   - Khóa/Mở khóa tài khoản

2. **Duyệt khóa học:**
   - Dashboard → "Course Moderation"
   - Xem các khóa học ở trạng thái "Pending"
   - Chọn "Published" để approve
   - Chọn "Rejected" để từ chối

3. **Xem thống kê:**
   - Dashboard → Xem biểu đồ:
     - Tổng số users, courses, enrollments
     - Top khóa học theo số học viên
     - Phân bố khóa học theo category

---

## 🔐 Luồng Authentication

```
1. User login (email/password hoặc Google OAuth)
   ↓
2. Backend verify credentials
   ↓
3. Tạo Access Token (expire 1h) + Refresh Token (expire 7 days)
   ↓
4. Frontend lưu cả 2 tokens vào localStorage
   ↓
5. Mỗi request → Axios tự gắn Access Token vào header
   ↓
6. Khi Access Token hết hạn:
   - Axios interceptor bắt lỗi 401
   - Tự động gọi /auth/refresh với Refresh Token
   - Lấy Access Token mới
   - Retry request ban đầu
   ↓
7. Khi Refresh Token hết hạn → User phải login lại
```

**Middleware Backend:**
- `protect`: Kiểm tra JWT token hợp lệ
- `restrictTo([role])`: Chỉ cho phép các role nhất định truy cập

---

## 🧪 Testing

### Backend API Tests

```bash
cd server
npm test
```

Tests bao gồm:
- Auth endpoints (register, login, refresh token)
- CRUD operations cho courses, lessons, quizzes
- Enrollment flow
- Programming exercise submission

---

## 🎨 UI/UX Features

- **Responsive Design:** Hoạt động tốt trên desktop, tablet, mobile
- **Dark Mode Ready:** Chuẩn bị cho chế độ tối
- **Loading States:** Skeleton loading và spinners
- **Error Handling:** Toast notifications cho lỗi và thành công
- **Form Validation:** Validate input trước khi submit
- **Code Editor:** Monaco Editor với syntax highlighting
- **Charts:** Recharts cho dashboard analytics

---

## 🚢 Deploy

### Backend (Railway/Render)

1. Push code lên GitHub
2. Connect với Railway/Render
3. Set environment variables
4. Auto deploy

### Frontend (Vercel)

1. Push code lên GitHub
2. Import project vào Vercel
3. Set `VITE_API_BASE_URL` environment variable
4. Auto deploy

---

## 📝 Tài khoản demo

| Email | Password | Role |
|-------|----------|------|
| `user@gmail.com` | `User@123456789` | Student |
| `instructor@gmail.com` | `Instructor@123` | Instructor |
| `admin@gmail.com` | `Admin@123` | Admin |

---

## 🤝 Contributing

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📞 Liên hệ

- **Email:** pvtai22@clc.fitus.edu.vn
- **GitHub:** [your-github](https://github.com/vtai2834)

---

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.
