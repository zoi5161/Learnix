# Learnix - Learning Management System (LMS)
## Comprehensive Project Report

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Database Design](#database-design)
3. [UI/UX Design](#uiux-design)
4. [User Guideline](#user-guideline)
5. [Deployment Guide](#deployment-guide)

---

## Project Overview

**Learnix** is a full-featured Learning Management System (LMS) built with the MERN stack (MongoDB, Express, React, Node.js). The platform supports three distinct user roles: **Students**, **Instructors**, and **Admins**, each with unique functionalities and workflows.

### Tech Stack

**Backend:**
- Node.js + Express.js - RESTful API server
- MongoDB + Mongoose - NoSQL database with ODM
- JWT (JSON Web Tokens) - Stateless authentication
- Google OAuth 2.0 - Social authentication
- Bcrypt - Password hashing
- Google Generative AI (Gemini) - AI-powered quiz generation
- Nodemailer - Email service for password reset

**Frontend:**
- React 19 + TypeScript - Modern UI framework
- Vite - Fast build tool
- React Router v7 - Client-side routing
- Axios - HTTP client with interceptors
- Monaco Editor - In-browser code editor
- Recharts - Data visualization
- Tailwind CSS - Utility-first CSS framework

### Key Features

- **Multi-role System**: Student, Instructor, Admin with role-based access control
- **Course Management**: Create, edit, publish courses with approval workflow
- **Lesson Types**: Video, Text, PDF, Quiz, Programming Exercise
- **Quiz System**: Manual creation and AI-powered generation
- **Programming IDE**: In-browser code execution for Python and JavaScript
- **Progress Tracking**: Lesson completion percentage and course progress
- **Budget System**: Virtual currency for course enrollment
- **Authentication**: Email/password and Google OAuth login
- **Real-time Updates**: Seamless UI updates and state management

---

## Database Design

### Overview

The database consists of **12 main collections** with relationships managed through MongoDB references (ObjectId). All models use Mongoose schemas with validation, indexes, and middleware.

---

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    User     │
└─────────────┘
       │
       ├──1:N──────────────┐
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │   Course    │
       │            └─────────────┘
       │                   │
       ├──1:N──────────────┼──1:N──────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Enrollment  │     │   Lesson    │     │    Review   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ├──1:N──────────────┐
       │                   │                    │
       │                   ▼                    ▼
       │            ┌─────────────┐     ┌──────────────────┐
       │            │    Quiz     │     │ Programming      │
       │            └─────────────┘     │ Exercise         │
       │                   │            └──────────────────┘
       │                   │                    │
       │                   ├──1:N──────┐        │
       │                   │           │        │
       ▼                   ▼           ▼        ▼
┌─────────────┐     ┌─────────────┐  ┌──────────────────┐
│  Progress   │     │  Question   │  │ CodeSubmission   │
└─────────────┘     └─────────────┘  └──────────────────┘
       ▲                   │
       │                   ▼
       │            ┌─────────────┐
       └────────────│ Submission  │
                    └─────────────┘
```

---

### 1. User Collection

**Purpose**: Stores all user accounts (Students, Instructors, Admins)

**Schema**:
```javascript
{
  name: String (required),
  email: String (required, unique),
  password_hash: String (select: false),
  role: String (enum: ['student', 'instructor', 'admin'], default: 'student'),
  googleId: String (unique, sparse),
  isLocked: Boolean (default: false),
  budget: Number (default: 100, min: 0),
  bonus_credits: Number (default: 0, min: 0),
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  timestamps: true
}
```

**Key Features**:
- Password hashing with bcrypt (pre-save hook)
- `matchPassword()` method for authentication
- Budget system for course enrollment
- Account locking capability for admins
- Support for Google OAuth via `googleId`

**Indexes**:
- `email`: unique index
- `googleId`: unique sparse index

---

### 2. Course Collection

**Purpose**: Stores course information with lifecycle status

**Schema**:
```javascript
{
  instructor_id: ObjectId → User,
  title: String (required),
  description: String (required),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  is_premium: Boolean (default: false),
  status: String (enum: ['draft', 'pending', 'approved', 'published', 'rejected', 'hidden']),
  thumbnail: String (URL),
  price: Number (default: 0),
  tags: [String],
  category: String,
  summary: String,
  timestamps: true
}
```

**Course Status Workflow**:
```
draft → pending → published (approved by admin)
                ↓
              rejected (can resubmit to pending)
```

**Key Features**:
- Text search index on title, description, summary, tags
- Category and status indexes for filtering
- Virtual fields for lesson count and enrollment count

---

### 3. Lesson Collection

**Purpose**: Individual lessons within a course

**Schema**:
```javascript
{
  course_id: ObjectId → Course (required),
  title: String (required),
  content_type: String (enum: ['video', 'text', 'pdf', 'quiz', 'assignment']),
  content: String (required), // URL or text content
  description: String,
  duration: Number (minutes),
  is_free: Boolean (default: false),
  order: Number (required),
  timestamps: true
}
```

**Indexes**:
- `{ course_id: 1, order: 1 }`: unique index (ensures unique ordering per course)

---

### 4. Enrollment Collection

**Purpose**: Tracks student enrollments in courses

**Schema**:
```javascript
{
  student_id: ObjectId → User (required),
  course_id: ObjectId → Course (required),
  status: String (enum: ['enrolled', 'completed', 'dropped', 'suspended']),
  timestamps: true
}
```

**Indexes**:
- `{ student_id: 1, course_id: 1 }`: unique index (one enrollment per student per course)

**Business Logic**:
- Deducts from student budget upon enrollment
- Checks if course price ≤ (student.budget + student.bonus_credits)
- Cannot enroll if already enrolled or budget insufficient

---

### 5. Progress Collection

**Purpose**: Tracks student progress through lessons

**Schema**:
```javascript
{
  student_id: ObjectId → User (required),
  course_id: ObjectId → Course (required),
  lesson_id: ObjectId → Lesson (required),
  status: String (enum: ['not_started', 'in_progress', 'completed']),
  completion_percentage: Number (0-100),
  time_spent: Number (seconds),
  last_accessed_at: Date,
  completed_at: Date,
  notes: String,
  timestamps: true
}
```

**Indexes**:
- `{ student_id: 1, course_id: 1, lesson_id: 1 }`: unique index

**Middleware**:
- Pre-save hook: Auto-set `completed_at` when status changes to 'completed'

---

### 6. Quiz Collection

**Purpose**: Quiz metadata for lessons

**Schema**:
```javascript
{
  course_id: ObjectId → Course (required),
  lesson_id: ObjectId → Lesson (required),
  title: String (required),
  description: String,
  time_limit: Number (minutes, 0 = no limit),
  attempts_allowed: Number (default: 3),
  passing_score: Number (0-100, default: 70),
  is_active: Boolean (default: true),
  timestamps: true
}
```

**Virtual Fields**:
- `questionsCount`: Number of questions in quiz

---

### 7. Question Collection

**Purpose**: Individual quiz questions

**Schema**:
```javascript
{
  quiz_id: ObjectId → Quiz (required),
  question_text: String (required),
  question_type: String (enum: ['multiple_choice', 'true_false', 'short_answer', 'essay']),
  options: [{
    text: String,
    is_correct: Boolean
  }],
  correct_answer: String (required),
  explanation: String,
  points: Number (default: 1, min: 1),
  order: Number (required),
  timestamps: true
}
```

**Indexes**:
- `{ quiz_id: 1, order: 1 }`: unique index (ensures unique question order per quiz)

---

### 8. Submission Collection

**Purpose**: Student quiz submissions

**Schema**:
```javascript
{
  quiz_id: ObjectId → Quiz (required),
  student_id: ObjectId → User (required),
  attempt_number: Number (default: 1),
  answers: [{
    question_id: ObjectId → Question,
    answer: String,
    is_correct: Boolean,
    points_earned: Number
  }],
  score: Number (percentage, 0-100),
  total_points: Number,
  timestamps: true
}
```

**Indexes**:
- `{ student_id: 1, quiz_id: 1, attempt_number: 1 }`

**Grading Logic**:
- Auto-grades multiple choice questions
- Calculates percentage score
- Stores detailed answer history

---

### 9. ProgrammingExercise Collection

**Purpose**: Coding challenges for lessons

**Schema**:
```javascript
{
  lesson_id: ObjectId → Lesson (required),
  title: String (required),
  description: String (required),
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
  languages: [String] (enum: ['python', 'javascript']),
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  time_limit: Number (seconds, default: 5),
  memory_limit: Number (MB, default: 128),
  is_active: Boolean,
  function_name: String (default: 'solution'),
  input_format: String (enum: ['json', 'space_separated', 'line_separated']),
  timestamps: true
}
```

---

### 10. CodeSubmission Collection

**Purpose**: Student code submission results

**Schema**:
```javascript
{
  exercise_id: ObjectId → ProgrammingExercise (required),
  student_id: ObjectId → User (required),
  lesson_id: ObjectId → Lesson (required),
  language: String (enum: ['python', 'javascript']),
  code: String (required),
  test_results: [{
    test_case_id: ObjectId,
    passed: Boolean,
    output: String,
    expected_output: String,
    error: String,
    execution_time: Number (ms),
    points_earned: Number
  }],
  score: Number (0-100),
  passed: Boolean,
  attempt_number: Number,
  execution_time: Number (total ms),
  timestamps: true
}
```

---

### 11. Review Collection

**Purpose**: Course reviews and ratings

**Schema**:
```javascript
{
  course_id: ObjectId → Course (required),
  user_id: ObjectId → User (required),
  rating: Number (1-5, required),
  content: String (required),
  title: String,
  timestamps: true
}
```

**Indexes**:
- `{ course_id: 1, user_id: 1 }`: unique index (one review per user per course)
- `{ course_id: 1, status: 1, created_at: -1 }`

---

### Database Relationships Summary

| Parent | Child | Type | Description |
|--------|-------|------|-------------|
| User | Course | 1:N | Instructor creates multiple courses |
| User | Enrollment | 1:N | Student enrolls in multiple courses |
| Course | Lesson | 1:N | Course contains multiple lessons |
| Course | Quiz | 1:N | Course contains multiple quizzes |
| Course | Review | 1:N | Course receives multiple reviews |
| Lesson | Quiz | 1:1 | Each lesson can have one quiz |
| Lesson | ProgrammingExercise | 1:N | Lesson contains programming exercises |
| Quiz | Question | 1:N | Quiz contains multiple questions |
| Quiz | Submission | 1:N | Quiz receives multiple submissions |
| User | Progress | 1:N | Student tracks progress across lessons |
| User | Submission | 1:N | Student submits multiple quizzes |
| User | CodeSubmission | 1:N | Student submits code solutions |

---

## UI/UX Design

### Design Philosophy

The Learnix platform follows a **clean, modern, and responsive** design approach with focus on:
- **User-centric navigation**: Clear role-based menus
- **Consistent color scheme**: Professional gradients and color-coded status
- **Responsive layouts**: Mobile-first design with Tailwind CSS
- **Accessibility**: Clear labels, proper contrast, keyboard navigation
- **Visual feedback**: Loading states, success/error messages, progress indicators

---

### Color Palette

```
Primary Colors:
- Blue: #3b82f6 (Primary actions, links)
- Green: #10b981 (Success, completed states)
- Yellow: #f59e0b (Warnings, pending states)
- Red: #ef4444 (Errors, rejected states)
- Gray: #6b7280 (Neutral, disabled states)

Gradients:
- Hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Cards: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

Background:
- Primary: #ffffff (White)
- Secondary: #f3f4f6 (Light gray)
- Dark: #1f2937
```

---

### Layout Structure

#### 1. Public Pages (Unauthenticated)

**Homepage** (`/`)
- Hero section with call-to-action
- Featured courses grid
- Category filters
- Search functionality
- Trending tags

**Login/Register** (`/login`, `/register`)
- Clean form design
- Google OAuth button
- Password strength indicator
- "Forgot Password" link
- Form validation feedback

**Course List** (`/courses`)
- Sidebar filters (category, level, tags)
- Course cards with thumbnail, title, stats
- Pagination
- Sort options (newest, price, popularity)

**Course Detail** (`/courses/:id`)
- Course header (title, instructor, price, level)
- Lesson list with content type icons
- Enrollment button
- Course description
- Prerequisites
- Suggested courses

---

#### 2. Student Dashboard (`/dashboard`)

**Layout Components**:
```
┌─────────────────────────────────────┐
│        PublicNavbar (Header)        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Stats Cards (3 columns)    │  │
│  │  - Enrolled  - Completed     │  │
│  │  - Progress  - Budget        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Enrolled Courses Grid      │  │
│  │   (Cards with progress bars) │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Recent Quiz Results        │  │
│  │   (Table with scores)        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Suggested Courses          │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Key Features**:
- Real-time budget display
- Course progress visualization (circular progress bars)
- Quick access to "Continue Learning"
- Recent quiz submissions with review button
- Suggested courses based on enrolled categories

---

#### 3. Instructor Dashboard (`/dashboard`)

**Layout Components**:
```
┌─────────────────────────────────────┐
│        PublicNavbar (Header)        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Stats Overview             │  │
│  │  - Total Courses             │  │
│  │  - Total Students            │  │
│  │  - Avg Quiz Score            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Quick Actions              │  │
│  │  [Create Course]             │  │
│  │  [Create Quiz with AI]       │  │
│  │  [View Submissions]          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   My Courses (Table)         │  │
│  │  - Title | Status | Students │  │
│  │  - Actions (Edit, Delete)    │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Key Features**:
- Course status badges (Draft, Pending, Published, Rejected)
- Submit for review button
- AI quiz generator shortcut
- Edit course and lessons
- View student enrollments and quiz submissions

---

#### 4. Admin Dashboard (`/dashboard`)

**Layout Components**:
```
┌─────────────────────────────────────┐
│        PublicNavbar (Header)        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   System Statistics          │  │
│  │  - Total Users               │  │
│  │  - Total Courses             │  │
│  │  - Total Enrollments         │  │
│  │  - Pending Approvals         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Quick Links                │  │
│  │  [User Management]           │  │
│  │  [Course Moderation]         │  │
│  │  [System Statistics]         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Charts & Analytics         │  │
│  │  (Bar/Pie charts with        │  │
│  │   Recharts)                  │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Admin Subpages**:

**Course Moderation** (`/dashboard/course-moderation`)
- All courses with status filter
- Status pie chart (Draft, Pending, Published, Rejected)
- Approve/Reject buttons for pending courses
- Quick status change dropdown

**User Management** (`/dashboard/user-management`)
- User list with role badges
- Lock/Unlock account toggle
- Change role dropdown (Student, Instructor, Admin)
- Search and filter users

---

#### 5. Lesson Viewer (`/courses/:courseId/learn/:lessonId`)

**Layout**:
```
┌─────────────────────────────────────┐
│  ← Back to Course                   │
├──────────────┬──────────────────────┤
│              │                      │
│  Lesson      │   Content Area       │
│  Sidebar     │                      │
│              │   [Video Player]     │
│  ☐ Lesson 1  │   or                 │
│  ☑ Lesson 2  │   [Text Content]     │
│  ☐ Lesson 3  │   or                 │
│              │   [PDF Viewer]       │
│              │   or                 │
│              │   [Code Editor]      │
│              │                      │
│              │   [Mark Complete]    │
│              │                      │
│              │   [Quiz Section]     │
│              │   (after complete)   │
│              │                      │
└──────────────┴──────────────────────┘
```

**Key Features**:
- Collapsible lesson sidebar
- Lesson completion checkmarks
- YouTube video embed for video lessons
- Monaco Editor for programming exercises
- Real-time code execution (Python/JavaScript)
- Test case results display
- Quiz unlocks after lesson completion

---

#### 6. Quiz Taking Interface (`/quizzes/:quizId/take`)

**Layout**:
```
┌─────────────────────────────────────┐
│   Quiz Title                        │
│   Timer: 15:00 (if time limit)     │
├─────────────────────────────────────┤
│                                     │
│   Question 1 of 10                  │
│                                     │
│   Question text here?               │
│                                     │
│   ○ Option A                        │
│   ○ Option B                        │
│   ○ Option C                        │
│   ○ Option D                        │
│                                     │
│   [Previous] [Next] [Submit Quiz]   │
│                                     │
└─────────────────────────────────────┘
```

**Key Features**:
- Question navigation (Previous/Next)
- Answer selection tracking
- Timer countdown (if applicable)
- Submit confirmation modal
- Immediate score display after submission
- Detailed answer review with correct/incorrect indicators

---

#### 7. AI Quiz Generator (`/quizzes/ai-draft`)

**Layout**:
```
┌─────────────────────────────────────┐
│   AI Quiz Generator                 │
├─────────────────────────────────────┤
│                                     │
│   [Select Course ▼]                 │
│   [Select Lesson ▼]                 │
│                                     │
│   Paste Lesson Content:             │
│   ┌─────────────────────────────┐  │
│   │                             │  │
│   │  (Large textarea)           │  │
│   │                             │  │
│   └─────────────────────────────┘  │
│                                     │
│   Number of Questions: [5 ▼]       │
│                                     │
│   [Generate with AI 🤖]            │
│                                     │
│   ─────────────────────────────    │
│                                     │
│   Generated Questions:              │
│   (Editable question list)          │
│                                     │
│   [Save Quiz]                       │
│                                     │
└─────────────────────────────────────┘
```

**Key Features**:
- Gemini AI integration for question generation
- Edit generated questions before saving
- Add/remove questions manually
- Set correct answers
- Preview quiz before saving

---

### Responsive Design

All pages implement mobile-responsive design with breakpoints:

```css
/* Mobile First Approach */
Default: < 768px (Mobile)
md: 768px - 992px (Tablet)
lg: 992px - 1200px (Desktop)
xl: > 1200px (Large Desktop)
```

**Mobile Optimizations**:
- Hamburger menu for navigation
- Stacked card layouts
- Touch-friendly button sizes
- Collapsible sidebars
- Bottom navigation for primary actions
- Optimized image loading

---

### Component Library

**Reusable Components**:

1. **PublicNavbar**
   - Logo, Search bar, Auth buttons
   - User menu with role-based links
   - Responsive mobile menu

2. **BaseLayout**
   - Wrapper for authenticated pages
   - Consistent padding and max-width

3. **CourseCard**
   - Thumbnail, Title, Instructor
   - Price, Level, Enrollment count
   - Hover effects

4. **ProgressBar**
   - Circular and linear variants
   - Animated percentage display

5. **Modal**
   - Overlay with blur background
   - Close on ESC or outside click
   - Customizable content

6. **StatusBadge**
   - Color-coded status indicators
   - Used for courses, enrollments, submissions

7. **ProgrammingIDE**
   - Monaco Editor integration
   - Language selector
   - Run/Submit buttons
   - Test results panel

---

## User Guideline

### Role-Based Workflows

---

### 1. Student Workflow

#### A. Registration & Login

**Step 1: Register Account**
1. Navigate to `/register`
2. Fill in:
   - Full Name
   - Email Address
   - Password (min 8 characters)
3. Click "Register"
4. Account created with role: `student`, budget: 100 credits

**Alternative**: Login with Google
1. Click "Continue with Google" button
2. Select Google account
3. Auto-creates account if first time
4. Redirects to Student Dashboard

**Step 2: Login**
1. Navigate to `/login`
2. Enter email and password
3. Click "Login"
4. Redirected to Student Dashboard

---

#### B. Browsing & Enrolling in Courses

**Step 1: Browse Courses**
1. Navigate to `/courses` or click "Courses" in navbar
2. Use filters:
   - Category (programming, design, marketing)
   - Level (beginner, intermediate, advanced)
   - Tags (react, python, ui-design, etc.)
3. Click on course card to view details

**Step 2: View Course Details**
1. On course detail page, view:
   - Course description and summary
   - Instructor information
   - Lesson list with content types
   - Course price and level
   - Number of students enrolled
2. Check if sufficient budget (displayed in navbar)

**Step 3: Enroll in Course**
1. Click "Enroll Now" button
2. Confirm enrollment in modal
3. System deducts price from budget
4. Success message appears
5. Button changes to "Go to Course"

**Budget System**:
- Each student starts with 100 credits
- Course price deducts from `budget` first, then `bonus_credits`
- Cannot enroll if `total_budget < course_price`
- Budget displayed in navbar and dashboard

---

#### C. Learning Workflow

**Step 1: Access Enrolled Course**
1. Go to Student Dashboard (`/dashboard`)
2. Click on course card
3. Or click "Continue Learning" for in-progress courses
4. Redirected to `/courses/:courseId/learn`

**Step 2: Navigate Lessons**
1. Lesson sidebar shows all lessons
2. Lessons have content type icons:
   - 🎥 Video
   - 📄 Text
   - 📁 PDF
   - ❓ Quiz
   - 💻 Programming
3. Click lesson to view content
4. Lessons unlock sequentially (must complete previous)

**Step 3: Complete Lesson**
1. Watch video / read content / solve exercise
2. Click "Mark as Complete" button
3. Progress saves automatically
4. Next lesson unlocks

**Video Lessons**:
- YouTube video embedded
- Progress tracked by time spent
- Can take notes (saved to Progress model)

**Text Lessons**:
- Markdown or HTML content rendered
- Scrollable content area

**Programming Exercises**:
1. Read problem description and test cases
2. Select language (Python or JavaScript)
3. Write code in Monaco Editor
4. Click "Run Code" to test against test cases
5. View output, errors, execution time
6. Must pass all test cases to complete

**Step 4: Take Quiz (After Lesson Completion)**
1. After marking lesson complete, "Start Quiz" button appears
2. Click to navigate to quiz page
3. Answer multiple choice questions
4. Questions display one at a time
5. Select answer for each question
6. Click "Next" or "Previous" to navigate
7. Click "Submit Quiz" when finished

**Step 5: Quiz Results**
1. Immediate score display (percentage)
2. Passed/Failed indicator (based on passing_score, default 70%)
3. Click "Review Answers" to see:
   - Correct/incorrect indicators
   - Correct answer for each question
   - Points earned per question
4. Can retake quiz if attempts remaining

---

#### D. Dashboard Overview

**Stats Cards**:
- **Enrolled Courses**: Total number of enrolled courses
- **Completed Courses**: Courses with 100% completion
- **Overall Progress**: Average progress across all courses
- **Budget**: Remaining credits and bonus credits

**Enrolled Courses Section**:
- Grid of course cards
- Progress bar showing completion percentage
- "Continue Learning" button
- Status: In Progress / Completed

**Recent Quiz Submissions**:
- Table showing recent quiz attempts
- Columns: Quiz Title, Score, Attempt, Date
- "Review" button to see detailed results
- "Retake" button if attempts remaining

**Suggested Courses**:
- Courses in same categories as enrolled courses
- Courses not yet enrolled in
- Quick enroll from dashboard

---

### 2. Instructor Workflow

#### A. Registration & Setup

**Step 1: Register as Instructor**
1. Register normal account (defaults to student)
2. Contact admin to upgrade role to `instructor`
3. Admin changes role via User Management page

**Alternative**: Admin creates instructor account directly

**Step 2: Access Instructor Dashboard**
1. Login with instructor account
2. Redirected to `/dashboard`
3. Dashboard displays:
   - Total Courses created
   - Total Students enrolled across courses
   - Average Quiz Score across all quizzes

---

#### B. Course Creation Workflow

**Step 1: Create New Course**
1. Navigate to `/courses` page
2. Click "Create Course" button
3. Fill in course form:
   - Title (required)
   - Description (required)
   - Summary (short description)
   - Category (e.g., programming, design)
   - Level (beginner/intermediate/advanced)
   - Price (default: 0 for free)
   - Tags (comma-separated)
   - Thumbnail URL (optional)
   - Is Premium (checkbox)
4. Click "Create Course"
5. Course created with status: `draft`

**Step 2: Add Lessons to Course**
1. After creating course, click "Edit" on course card
2. Navigate to "Lessons" tab
3. Click "Add Lesson"
4. Fill in lesson form:
   - Title (required)
   - Content Type (video/text/pdf/quiz/assignment)
   - Content (URL for video/pdf, or text content)
   - Description (optional)
   - Duration (in minutes)
   - Is Free (allows preview without enrollment)
   - Order (auto-increments)
5. Click "Save Lesson"
6. Repeat for all lessons

**Step 3: Create Quiz for Lesson**

**Option A: Manual Creation**
1. Navigate to `/quizzes`
2. Click "Create Quiz Manually"
3. Fill in quiz metadata:
   - Title
   - Select Course
   - Select Lesson
   - Time Limit (minutes, 0 = unlimited)
   - Attempts Allowed (default: 3)
   - Passing Score (default: 70%)
4. Add questions:
   - Click "Add Question"
   - Enter question text
   - Add 4 options
   - Mark correct answer
   - Set points (default: 1)
5. Click "Save Quiz"

**Option B: AI-Powered Generation**
1. Navigate to `/quizzes/ai-draft`
2. Select Course and Lesson
3. Paste lesson content (text, lecture notes)
4. Select number of questions (default: 5)
5. Click "Generate with AI 🤖"
6. Gemini AI generates questions based on content
7. Review and edit generated questions
8. Adjust correct answers if needed
9. Click "Save Quiz"

**AI Quiz Generator Features**:
- Uses Google Gemini AI (generative-ai)
- Analyzes lesson content
- Generates contextual questions
- Creates 4 options per question
- Marks correct answer
- Editable before saving

**Step 4: Add Programming Exercise (Optional)**
1. Navigate to lesson edit page
2. Click "Add Programming Exercise"
3. Fill in:
   - Title and Description
   - Supported Languages (Python/JavaScript)
   - Starter Code (template code for student)
   - Function Name (e.g., `solution`)
   - Test Cases:
     - Input (JSON format)
     - Expected Output
     - Is Hidden (hide from student)
     - Points
4. Click "Save Exercise"

**Example Programming Exercise**:
```
Title: Sum of Two Numbers
Description: Write a function that takes two numbers and returns their sum.
Language: Python
Starter Code:
```python
def solution(a, b):
    # Your code here
    pass
```

Test Case 1:
- Input: {"a": 5, "b": 3}
- Expected: 8
- Hidden: No
- Points: 10

Test Case 2:
- Input: {"a": -1, "b": 10}
- Expected: 9
- Hidden: Yes
- Points: 5
```

---

#### C. Course Submission & Publishing Workflow

**Step 1: Review Course**
1. Go to `/courses` page
2. Verify course has:
   - Complete description
   - At least one lesson
   - Proper categorization
   - Thumbnail (optional but recommended)

**Step 2: Submit for Review**
1. Click "Submit for Review" button on course card
2. Confirm submission
3. Course status changes: `draft` → `pending`
4. Notification sent to admins

**What Happens Next**:
- Admin reviews course in Course Moderation page
- Admin can:
  - **Approve**: status changes to `published`
  - **Reject**: status changes to `rejected`
- If rejected:
  - Instructor receives notification
  - Can edit course and resubmit
  - Status changes: `rejected` → `pending`

**Status Workflow Diagram**:
```
draft (instructor creates)
  ↓
pending (instructor submits for review)
  ↓
  ├─→ published (admin approves)
  └─→ rejected (admin rejects)
        ↓
     pending (instructor resubmits)
```

**Step 3: Course Published**
1. Once approved, course appears in public course list
2. Students can enroll
3. Instructor can view enrollment stats
4. Instructor can edit course (but must resubmit for approval)

**Status Meanings**:
- **draft**: Work in progress, not visible to students
- **pending**: Submitted for admin review
- **published**: Approved and visible to all students
- **rejected**: Not approved, instructor can edit and resubmit
- **hidden**: Admin temporarily hid course (can be unhidden)

---

#### D. Monitoring & Analytics

**View Student Enrollments**
1. Go to Instructor Dashboard
2. Click on course
3. View "Students" tab
4. See list of enrolled students

**View Quiz Submissions**
1. Navigate to `/quizzes`
2. Click on quiz
3. Click "View Submissions"
4. See table of all student attempts:
   - Student name
   - Attempt number
   - Score
   - Date
   - Passed/Failed
5. Click "View Details" to see individual answers

**View Code Submissions**
1. Navigate to lesson with programming exercise
2. Click "View Submissions"
3. See all student code attempts
4. Review code, test results, execution time

---

#### E. Course Management

**Edit Course**
1. Go to `/courses`
2. Click "Edit" on course card
3. Update course details
4. If course is published, changes trigger: `published` → `draft`
5. Must resubmit for review

**Delete Course**
1. Click "Delete" button on course card
2. Confirm deletion
3. Course and all associated data deleted:
   - Lessons
   - Quizzes
   - Questions
   - Enrollments preserved (for records)

**Publish/Unpublish (Quick Toggle)**
- Instructors can quick-toggle between `draft` and `published`
- Only works if course was previously approved
- Useful for temporarily hiding course

---

### 3. Admin Workflow

#### A. Access & Overview

**Step 1: Login as Admin**
1. Login with admin credentials
2. Redirected to Admin Dashboard

**Dashboard Components**:
- **System Statistics**:
  - Total Users (Students, Instructors, Admins)
  - Total Courses (by status)
  - Total Enrollments
  - Pending Course Approvals (requires action)
- **Quick Links**:
  - User Management
  - Course Moderation
  - System Statistics (detailed charts)
- **Charts**:
  - User Distribution (Pie Chart)
  - Course Status Distribution (Bar Chart)
  - Enrollment Trends (Line Chart)

---

#### B. User Management

**Navigate to User Management**
1. Dashboard → "User Management"
2. Or navigate to `/dashboard/user-management`

**View Users**
- Table displaying:
  - Name, Email, Role, Status (Active/Locked)
  - Registration Date
  - Last Login (future feature)
- Pagination and search

**Change User Role**
1. Click role dropdown for user
2. Select new role:
   - Student
   - Instructor
   - Admin
3. Confirm change
4. User's role updated immediately

**Lock/Unlock User Account**
1. Click "Lock" button for user
2. Confirm action
3. User's `isLocked` field set to `true`
4. Locked user cannot login:
   - Login attempt shows: "Your account has been locked"
   - All API requests return 403 Forbidden
5. Click "Unlock" to restore access

**Use Cases for Locking**:
- Violation of terms
- Spam or abuse
- Payment issues
- Temporary suspension

---

#### C. Course Moderation

**Navigate to Course Moderation**
1. Dashboard → "Course Moderation"
2. Or navigate to `/dashboard/course-moderation`

**View All Courses**
- Table displaying:
  - Course Title, Instructor, Status, Students, Created Date
- Filter by status:
  - All
  - Draft
  - Pending (requires review)
  - Published
  - Rejected

**Visual Status Distribution**
- Pie chart showing course count by status
- Colors:
  - Gray: Draft
  - Yellow: Pending
  - Green: Published
  - Red: Rejected

**Approve Course**
1. Find course with status `pending`
2. Click "Approve" button
3. Confirm approval
4. Course status changes: `pending` → `published`
5. Course appears in public course list
6. Instructor notified

**Reject Course**
1. Find course with status `pending`
2. Click "Reject" button
3. Enter rejection reason (optional)
4. Confirm rejection
5. Course status changes: `pending` → `rejected`
6. Instructor can edit and resubmit

**Change Course Status (Manual)**
1. Click status dropdown for course
2. Select target status:
   - draft
   - pending
   - published
   - rejected
   - hidden
3. Status updated with workflow validation

**Status Workflow Validation**:
- Admins can override and set any status
- Instructors have restricted transitions:
  - Can: `draft → pending`
  - Can: `rejected → pending`
  - Cannot: Directly set to `published`

**Hide/Unhide Course**
1. For published course causing issues
2. Set status to `hidden`
3. Course removed from public list but not deleted
4. Can be unhidden later

---

#### D. System Monitoring

**System Statistics Page**
1. Navigate to `/dashboard/statistics`
2. View comprehensive charts:
   - **User Growth**: Line chart over time
   - **Course Creation**: Bar chart by category
   - **Enrollment Trends**: Line chart over time
   - **Quiz Performance**: Average scores by course
   - **Active Users**: Daily/Weekly/Monthly active users

**Database Stats**:
- Total documents in each collection
- Database size
- Most popular courses
- Top instructors by student count

---

#### E. Content Management

**Manage Any Course**
1. Admin can edit/delete any course
2. Bypass instructor permission checks
3. Assign course to different instructor

**Manage Any Quiz**
1. Edit any quiz
2. Delete quiz
3. Review all submissions

**Emergency Actions**:
- Delete inappropriate content
- Remove spam courses
- Reset user progress (future feature)
- Bulk actions (future feature)

---

### Common User Tasks

#### Forgot Password Workflow (All Roles)

**Step 1: Request Reset**
1. Click "Forgot Password" on login page
2. Enter email address
3. Click "Send Reset Link"
4. System:
   - Generates reset token (random, expires in 1 hour)
   - Sends email with reset link
   - Link format: `/reset-password/:token`

**Step 2: Reset Password**
1. Click link in email
2. Redirected to reset page with token
3. Enter new password
4. Confirm new password
5. Click "Reset Password"
6. Password updated, token invalidated
7. Redirected to login

**Security Features**:
- Token expires after 1 hour
- Token invalidated after use
- Password hashed with bcrypt before storage
- Old password cannot be reused (future feature)

---

#### Change Profile Information

**Step 1: Access Profile**
1. Click user avatar in navbar
2. Select "Profile" from dropdown
3. Navigate to `/profile`

**Step 2: Edit Information**
1. Update:
   - Name
   - Email (must be unique)
   - Password (optional)
2. Click "Save Changes"
3. Success message appears

---

#### Search Functionality

**Global Search** (Navbar)
1. Click search icon in navbar
2. Enter search term
3. Press Enter or click search icon
4. Redirected to `/courses?search=term`
5. Results filtered by:
   - Course title
   - Course description
   - Course tags

**Advanced Filtering**
1. On course list page
2. Use sidebar filters:
   - Category (dropdown)
   - Level (dropdown)
   - Tags (clickable tags)
3. Combine filters for precise results
4. Results update in real-time

---

## Deployment Guide

### Local Development Setup

#### Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x (local or MongoDB Atlas)
- npm or yarn
- Git

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/learnix.git
cd learnix
```

#### Step 2: Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/learnix
CLIENT_URL=http://localhost:3000

JWT_SECRET=your-super-secret-jwt-key-64-characters-minimum
JWT_REFRESH_SECRET=your-refresh-secret-key-64-characters-minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Email (optional - for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@learnix.com

# Gemini AI (optional - for quiz generation)
GEMINI_API_KEY=your-gemini-api-key
```

**Start Backend**:
```bash
npm run dev
# Server runs on http://localhost:8000
```

#### Step 3: Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Start Frontend**:
```bash
npm run dev
# Client runs on http://localhost:3000
```

#### Step 4: Seed Database (Optional)

```bash
cd server
node config/seed_db.js
```

This creates:
- 3 demo users (student, instructor, admin)
- 10 sample courses
- 30 sample lessons

**Demo Accounts**:
| Role | Email | Password |
|------|-------|----------|
| Student | user@gmail.com | User@123456789 |
| Instructor | instructor@gmail.com | Instructor@123 |
| Admin | admin@gmail.com | Admin@123 |

---

### Docker Deployment

#### Prerequisites

- Docker Desktop installed
- Docker Compose

#### Step 1: Create `.env` File

Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

Edit `.env` with your secrets.

#### Step 2: Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Backend API on port 8000
- Frontend on port 3000

#### Step 3: Seed Database

```bash
docker-compose exec server node config/seed_db.js
```

#### Step 4: Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

---

### Production Deployment

#### Option 1: Deploy to Cloud Platform (Vercel + MongoDB Atlas)

**Backend** (Deploy to Vercel/Heroku/Railway):

1. Create MongoDB Atlas cluster
2. Get connection string
3. Set environment variables in platform
4. Deploy backend:
   ```bash
   # For Vercel
   vercel --prod
   ```

**Frontend** (Deploy to Vercel/Netlify):

1. Update `VITE_API_BASE_URL` to production backend URL
2. Build frontend:
   ```bash
   npm run build
   ```
3. Deploy `dist/` folder:
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy with Docker on VPS

1. Set up VPS (DigitalOcean, AWS EC2, Linode)
2. Install Docker and Docker Compose
3. Clone repository
4. Create `.env` with production values
5. Run:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```
6. Configure nginx reverse proxy
7. Set up SSL with Let's Encrypt

#### Environment Variables for Production

**Required**:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Strong random string (64+ chars)
- `JWT_REFRESH_SECRET`: Different strong random string
- `CLIENT_URL`: Production frontend URL

**Optional but Recommended**:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `EMAIL_USER` & `EMAIL_PASS`
- `GEMINI_API_KEY`

#### Security Checklist

- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set secure MongoDB credentials
- [ ] Configure CORS for production domain only
- [ ] Rate limiting on API endpoints
- [ ] Input validation and sanitization
- [ ] Regular database backups
- [ ] Monitor error logs
- [ ] Keep dependencies updated

---

### API Documentation

#### Base URL

**Local**: `http://localhost:8000/api`
**Production**: `https://your-domain.com/api`

---

#### Authentication Endpoints

**POST** `/auth/register`
- Body: `{ name, email, password }`
- Response: `{ accessToken, refreshToken, user }`

**POST** `/auth/login`
- Body: `{ email, password }`
- Response: `{ accessToken, refreshToken, user }`

**POST** `/auth/refresh`
- Body: `{ refreshToken }`
- Response: `{ accessToken, refreshToken }`

**GET** `/auth/google`
- Redirects to Google OAuth consent screen

**GET** `/auth/google/callback`
- Handles Google OAuth callback

**POST** `/auth/forgot-password`
- Body: `{ email }`
- Response: `{ message }`

**POST** `/auth/reset-password/:token`
- Body: `{ password }`
- Response: `{ message }`

---

#### Course Endpoints

**GET** `/courses`
- Query: `?page=1&limit=12&category=programming&level=beginner&search=react&sort=createdAt&order=desc`
- Response: `{ courses, pagination }`

**GET** `/courses/:id`
- Response: `{ course, isEnrolled }`

**GET** `/courses/categories`
- Response: `{ categories: [] }`

**GET** `/courses/tags/trending`
- Response: `{ tags: [{ tag, count }] }`

**GET** `/courses/search?q=keyword`
- Response: `{ courses, pagination }`

**GET** `/courses/:courseId/suggested`
- Response: `{ courses: [] }`

**POST** `/courses` 🔒 (Instructor/Admin)
- Body: `{ title, description, level, price, category, tags, thumbnail, is_premium }`
- Response: `{ course }`

**PUT** `/courses/:id` 🔒 (Instructor/Admin, Owner)
- Body: Course update fields
- Response: `{ course }`

**DELETE** `/courses/:id` 🔒 (Instructor/Admin, Owner)
- Response: `{ message }`

**PATCH** `/courses/:id/status` 🔒 (Instructor/Admin)
- Body: `{ status: 'pending' | 'published' | 'rejected' }`
- Response: `{ course, message }`

**PATCH** `/courses/:id/publish` 🔒 (Instructor/Admin)
- Response: `{ course, message }`

---

#### Enrollment Endpoints

**POST** `/enrollments/enroll/:courseId` 🔒 (Student)
- Response: `{ enrollment, message, remainingBudget }`

**DELETE** `/enrollments/unenroll/:courseId` 🔒 (Student)
- Response: `{ message }`

**GET** `/enrollments/my-enrollments` 🔒 (Student)
- Response: `{ enrollments: [] }`

---

#### Student Endpoints

**GET** `/student/dashboard` 🔒 (Student)
- Response: `{ student, statistics, enrolledCourses, suggestedCourses }`

**GET** `/student/budget` 🔒 (Student)
- Response: `{ budget, bonus_credits, total }`

---

#### Quiz Endpoints

**GET** `/quizzes`
- Query: `?courseId=xxx`
- Response: `{ quizzes: [] }`

**GET** `/quizzes/:id` 🔒 (Student/Instructor)
- Response: `{ quiz, questions }`

**POST** `/quizzes/:id/submit` 🔒 (Student)
- Body: `{ answers: [{ questionIndex, selectedOption }] }`
- Response: `{ score, passed, resultDetails }`

**POST** `/quizzes/generate-with-ai` 🔒 (Instructor/Admin)
- Body: `{ courseId, lessonId, content, numQuestions }`
- Response: `{ questions: [] }`

**POST** `/quizzes` 🔒 (Instructor/Admin)
- Body: Quiz and questions data
- Response: `{ quiz }`

---

#### Lesson Endpoints

**GET** `/courses/:courseId/lessons`
- Response: `{ lessons: [] }`

**GET** `/courses/:courseId/lessons/:lessonId`
- Response: `{ lesson }`

**POST** `/courses/:courseId/lessons` 🔒 (Instructor/Admin)
- Body: `{ title, content_type, content, description, duration, is_free, order }`
- Response: `{ lesson }`

**PUT** `/courses/:courseId/lessons/:lessonId` 🔒 (Instructor/Admin)
- Body: Lesson update fields
- Response: `{ lesson }`

---

#### Programming Exercise Endpoints

**GET** `/programming/exercises/lesson/:lessonId`
- Response: `{ exercises: [] }`

**POST** `/programming/submit` 🔒 (Student)
- Body: `{ exerciseId, lessonId, language, code }`
- Response: `{ submission, test_results, score, passed }`

---

🔒 = Requires authentication (Bearer token)

---

### Testing

#### Backend Tests

```bash
cd server
npm test
```

Tests cover:
- Authentication flows
- CRUD operations
- Authorization checks
- Quiz grading logic
- Code execution

#### Frontend Tests

```bash
cd client
npm test
```

Tests cover:
- Component rendering
- User interactions
- API integration
- Routing

---

### Monitoring & Maintenance

#### Logs

**Backend Logs**:
```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs server

# Docker
docker-compose logs -f server
```

**Frontend Logs**:
- Browser console for client-side errors
- Network tab for API calls

#### Database Maintenance

**Backup MongoDB**:
```bash
mongodump --uri="mongodb://localhost:27017/learnix" --out=/backup/learnix-$(date +%Y%m%d)
```

**Restore MongoDB**:
```bash
mongorestore --uri="mongodb://localhost:27017/learnix" /backup/learnix-20240101/learnix
```

#### Performance Optimization

- Enable MongoDB indexes (already configured in models)
- Implement Redis caching for frequently accessed data
- Use CDN for static assets
- Lazy load images
- Code splitting on frontend
- Database query optimization

---

## Conclusion

Learnix is a comprehensive LMS platform that provides:

✅ **Complete Learning Ecosystem**
- Course creation and management
- Multiple content types
- Interactive quizzes and programming exercises
- Progress tracking

✅ **Role-Based Architecture**
- Students: Browse, enroll, learn
- Instructors: Create, manage courses
- Admins: Moderate content, manage users

✅ **Modern Tech Stack**
- MERN stack with TypeScript
- JWT authentication
- AI integration (Gemini)
- Responsive design

✅ **Production-Ready**
- Docker support
- Comprehensive API
- Security best practices
- Scalable architecture

---

**Project Repository**: [GitHub Link]
**Live Demo**: [Demo URL]
**Documentation**: This file

---

*Last Updated: 2025-01-03*
*Version: 1.0.0*

