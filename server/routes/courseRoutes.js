const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
    getCourses,
    getCourseById,
    getCategories,
    getTrendingTags,
    searchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePublish,
    assignInstructor,
    manageTags
} = require('../controllers/courseController');

// 1. Import Lesson Router
const lessonRouter = require('./lessonRoutes');

const router = express.Router();

// ==========================================
// 🔄 MOUNT ROUTER (Kết nối Route con)
// ==========================================
// Bất cứ request nào có dạng "/:courseId/lessons" sẽ chuyển sang lessonRouter xử lý
router.use('/:courseId/lessons', lessonRouter);


// ==========================================
// 🔓 PUBLIC COURSE ROUTES
// ==========================================
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/tags/trending', getTrendingTags);
router.get('/search', searchCourses);
router.get('/:id', optionalAuth, getCourseById); // Cho phép xem chi tiết (để check đã enroll chưa)

// ==========================================
// 🔒 PROTECTED COURSE ROUTES
// ==========================================
// Từ dòng này trở xuống yêu cầu phải login
router.use(protect);

// --- Create Course ---
router.post('/', restrictTo(['instructor', 'admin']), createCourse);

// --- Update & Delete Course ---
router
    .route('/:id')
    .put(restrictTo(['instructor', 'admin']), updateCourse)
    .delete(restrictTo(['instructor', 'admin']), deleteCourse);

// --- Publish Management ---
router.patch('/:id/publish', restrictTo(['instructor', 'admin']), togglePublish);
router.patch('/:id/unpublish', restrictTo(['instructor', 'admin']), togglePublish);

// --- Tags Management ---
router.patch('/:id/tags/add', restrictTo(['instructor', 'admin']), manageTags);
router.patch('/:id/tags/remove', restrictTo(['instructor', 'admin']), manageTags);

// --- Admin Only Actions ---
router.patch('/:id/assign-instructor', restrictTo(['admin']), assignInstructor);

module.exports = router;