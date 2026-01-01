const instructorService = require('../services/instructorService');

/**
 * Get instructor statistics
 */
exports.getInstructorStats = async (req, res) => {
    try {
        const instructorId = req.user._id;
        const stats = await instructorService.getInstructorStats(instructorId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

