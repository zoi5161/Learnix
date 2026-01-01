const studentService = require('../services/studentService');

// Get student dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;
        const data = await studentService.getDashboard(studentId);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// Get student budget info
exports.getBudget = async (req, res) => {
    try {
        const studentId = req.user.id;
        const data = await studentService.getBudget(studentId);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching budget',
            error: error.message
        });
    }
};
