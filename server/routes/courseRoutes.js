const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');

const {
    getCourses,
    getCategories,
    getTrendingTags,
    searchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    getInstructorCourses,
    getCourseById
} = require('../controllers/courseController');
const {
    getCourseLessons,
    getLesson,
    updateProgress,
    createLesson, 
    updateLesson,
    deleteLesson
} = require('../controllers/lessonController');

const {
    createQuiz,
    getQuizForInstructor,
    getQuizForStudent,
    submitQuiz,
    updateQuiz
} = require('../controllers/quizController');

const router = express.Router();

// --- Public routes ---
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/tags/trending', getTrendingTags);
router.get('/search', searchCourses);

// --- Protected routes: Lesson Management (Instructor/Admin) ---
// Route cho việc lấy danh sách Lesson và tạo Lesson mới
router.route('/:courseId/lessons')
    .get(protect, restrictTo(['student', 'instructor', 'admin']), getCourseLessons)
    .post(protect, restrictTo(['instructor', 'admin']), createLesson); 

// --- Protected routes: Quiz Management (Instructor/Admin/Student) ---
router.route('/:courseId/lessons/:lessonId/quiz')
    .get(protect, restrictTo(['instructor', 'admin']), getQuizForInstructor)
    .post(protect, restrictTo(['instructor', 'admin']), createQuiz)
    .put(protect, restrictTo(['instructor', 'admin']), updateQuiz);

// Route cho việc lấy/cập nhật/xóa Lesson
router.route('/:courseId/lessons/:lessonId')
    .get(protect, restrictTo(['student', 'instructor', 'admin']), getLesson) 
    .put(protect, restrictTo(['instructor', 'admin']), updateLesson)
    .delete(protect, restrictTo(['instructor', 'admin']), deleteLesson);

// Route Submit Quiz (Dùng POST để gửi dữ liệu bài làm)
router.post(
    '/:courseId/lessons/:lessonId/quiz/submit', 
    protect, 
    restrictTo('student'), 
    submitQuiz
);

// Route cho Student xem Quiz (Không bao gồm đáp án)
router.get(
    '/:courseId/lessons/:lessonId/quiz/view', 
    protect, 
    restrictTo(['student', 'instructor', 'admin']), 
    getQuizForStudent
);


// --- Protected routes ---

// Lesson progress update (student)
router.put('/:courseId/lessons/:lessonId/progress', protect, restrictTo(['student']), updateProgress);

// Course Management (instructor/admin)
router.route('/mine')
    .get(protect, restrictTo(['instructor', 'admin']), getInstructorCourses)
    .post(protect, restrictTo(['instructor', 'admin']), createCourse);

router.route('/:id')
    .put(protect, restrictTo(['instructor', 'admin']), updateCourse)
    .delete(protect, restrictTo(['instructor', 'admin']), deleteCourse);
    
router.put('/:id/publish', protect, restrictTo(['instructor', 'admin']), publishCourse);
router.get('/:id', optionalAuth, getCourseById);

module.exports = router;