const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    getCourseLessons,
    getLesson,
    updateProgress,
    getLessonsByCourse,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons
} = require('../controllers/lessonController');

// ⚠️ QUAN TRỌNG: mergeParams: true giúp lấy được :courseId từ router cha
const router = express.Router({ mergeParams: true });

// Tất cả các route bài học đều yêu cầu đăng nhập
router.use(protect);

// ==========================================
// 🎓 STUDENT ROUTES
// ==========================================

// 1. Lấy danh sách bài học (cho giao diện học tập của Student)
// GET /api/courses/:courseId/lessons
router.get('/', restrictTo(['student', 'admin', 'instructor']), getCourseLessons);

// ==========================================
// 🛠 INSTRUCTOR / ADMIN MANAGEMENT
// (Đặt các route này LÊN TRƯỚC route /:lessonId để tránh xung đột)
// ==========================================

// 2. Lấy danh sách quản lý (cho trang Manager, không check enroll)
// GET /api/courses/:courseId/lessons/manage/all
router.get('/manage/all', restrictTo(['instructor', 'admin']), getLessonsByCourse);

// 3. Sắp xếp lại vị trí bài học
// PUT /api/courses/:courseId/lessons/reorder
router.put('/reorder', restrictTo(['instructor', 'admin']), reorderLessons);

// 4. Tạo bài học mới
// POST /api/courses/:courseId/lessons
router.post('/', restrictTo(['instructor', 'admin']), createLesson);

// ==========================================
// 🔗 SINGLE LESSON ROUTES (Dynamic ID)
// ==========================================

// 5. Thao tác trên 1 bài học cụ thể
// GET /api/courses/:courseId/lessons/:lessonId
// PUT /api/courses/:courseId/lessons/:lessonId (Update)
// DELETE /api/courses/:courseId/lessons/:lessonId (Delete)
router.route('/:lessonId')
    .get(restrictTo(['student', 'admin', 'instructor']), getLesson)
    .put(restrictTo(['instructor', 'admin']), updateLesson)
    .delete(restrictTo(['instructor', 'admin']), deleteLesson);

// 6. Cập nhật tiến độ học tập (Chỉ Student)
// PUT /api/courses/:courseId/lessons/:lessonId/progress
router.put('/:lessonId/progress', restrictTo(['student']), updateProgress);

module.exports = router;