const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Giảng viên có thể tạo khóa học
router.post('/', protect, restrictTo(['instructor', 'admin']), (req, res) => {
    res.json({ message: 'Course created successfully (placeholder)' });
});

// Sinh viên và Khách có thể xem danh sách khóa học
router.get('/', (req, res) => {
    res.json({ courses: [], message: 'List of courses (placeholder)' });
});

module.exports = router;
