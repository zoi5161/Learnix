const quizService = require('../services/quizService');

// ==============================================
// 1. GET ALL QUIZZES (Filter by course_id)
// ==============================================
exports.getQuizzes = async (req, res) => {
    try {
        const { course_id } = req.query;
        const quizzes = await quizService.getQuizzes(course_id);
        res.status(200).json({
            success: true,
            data: {
                quizzes
            }
        });
    } catch (error) {
        console.error("🔥 GET QUIZZES ERROR:", error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ==============================================
// 2. GET QUIZ BY ID (Cho Student làm bài)
// ==============================================
exports.getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await quizService.getQuizById(id);
        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error(error);
        const statusCode = error.message === 'Quiz not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
    }
};

// ==============================================
// 3. SUBMIT QUIZ (Chấm điểm)
// ==============================================
exports.submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const userId = req.user.id;
        const result = await quizService.submitQuiz(quizId, answers, userId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Submit Error:", error);
        const statusCode = error.message === 'Questions not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
    }
};

// ==============================================
// 4. CREATE QUIZ (Cho Instructor)
// ==============================================
exports.createQuiz = async (req, res) => {
    try {
        const newQuiz = await quizService.createQuiz(req.body);
        res.status(201).json({ success: true, data: newQuiz });
    } catch (error) {
        console.error("Create Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================================
// 5. UPDATE QUIZ (Cho Instructor)
// ==============================================
exports.updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedQuiz = await quizService.updateQuiz(id, req.body);
        res.status(200).json({ success: true, data: updatedQuiz });
    } catch (error) {
        console.error("Update Quiz Error:", error);
        const statusCode = error.message === 'Quiz not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// ==============================================
// 6. DELETE QUIZ
// ==============================================
exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await quizService.deleteQuiz(id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Delete Quiz Error:", error);
        const statusCode = error.message === 'Quiz not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// ==============================================
// GET MY SUBMISSIONS
// ==============================================
exports.getMySubmissions = async (req, res) => {
    try {
        const { course_id } = req.query;
        const userId = req.user.id;
        const submissions = await quizService.getMySubmissions(userId, course_id);
        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error("Get My Submissions Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ==============================================
// Generate MCQ from lesson text (AI draft)
// ==============================================
exports.generateMCQFromText = async (req, res) => {
    try {
        const { text } = req.body;
        const mcqs = await quizService.generateMCQFromText(text);
        res.json({ success: true, mcqs });
    } catch (error) {
        console.error('Generate MCQ Error:', error);
        const statusCode = error.message === 'Missing or invalid lesson text.' ? 400 :
                          error.message === 'AI response is not valid JSON' ? 500 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
    }
};
