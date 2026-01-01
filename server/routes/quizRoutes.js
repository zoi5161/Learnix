const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Submission = require('../models/Submission'); // Đảm bảo đã import
// ==============================================
// 📌 PUBLIC / STUDENT ROUTES
// ==============================================

// 1. Lấy danh sách Quiz (Sửa lỗi 404 ở đây)
// URL: /api/quizzes?course_id=...
router.get('/', quizController.getQuizzes); 
router.get('/my-submissions', protect, quizController.getMySubmissions);

// 2. Lấy chi tiết Quiz để làm bài
router.get('/:id', protect, quizController.getQuizById);

// 3. Nộp bài
router.post('/:quizId/submit', protect, quizController.submitQuiz);

// ==============================================
// 📌 INSTRUCTOR ROUTES
// ==============================================
router.post('/', protect, restrictTo(['instructor', 'admin']), quizController.createQuiz);

router.put('/:id', protect, restrictTo(['instructor', 'admin']), quizController.updateQuiz);

// Xóa Quiz
router.delete('/:id', protect, restrictTo(['instructor', 'admin']), quizController.deleteQuiz);

// Get Quiz Submissions (for instructor/admin)
router.get('/:id/submissions', protect, restrictTo(['instructor', 'admin']), quizController.getQuizSubmissions);

// Get Quiz Submission Stats (for instructor/admin)
router.get('/:id/stats', protect, restrictTo(['instructor', 'admin']), quizController.getQuizSubmissionStats);

// Generate MCQ from lesson text (AI)
router.post('/generate-mcq', protect, restrictTo(['instructor', 'admin']), quizController.generateMCQFromText);

module.exports = router;