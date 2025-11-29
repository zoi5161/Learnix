const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    getDashboard,
    getBudget
} = require('../controllers/studentController');

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(restrictTo(['student']));

// Get student dashboard
router.get('/dashboard', getDashboard);

// Get student budget
router.get('/budget', getBudget);

module.exports = router;

