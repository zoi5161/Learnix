const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getInstructorStats } = require('../controllers/instructorController');

const router = express.Router();

// All routes require authentication and instructor role
router.use(protect);
router.use(restrictTo(['instructor']));

// Get instructor statistics
router.get('/stats', getInstructorStats);

module.exports = router;

