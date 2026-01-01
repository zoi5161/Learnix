const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// Gemini (Google Generative AI)
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get all quizzes (Filter by course_id)
 */
const getQuizzes = async (courseId = null) => {
    let query = {};

    if (courseId) {
        query.course_id = courseId;
    }

    const quizzes = await Quiz.find(query)
        .populate({ path: 'course_id', select: 'title', strictPopulate: false })
        .populate({ path: 'lesson_id', select: 'title', strictPopulate: false })
        .sort({ createdAt: -1 })
        .lean();

    const formattedQuizzes = await Promise.all(quizzes.map(async (q) => {
        const questionCount = await Question.countDocuments({ quiz_id: q._id });

        const courseData = q.course_id || {};
        const lessonData = q.lesson_id || {};

        return {
            ...q,
            id: q._id,
            questionsCount: questionCount,
            course_id: courseData,
            lesson_id: lessonData
        };
    }));

    return formattedQuizzes;
};

/**
 * Get quiz by ID (For Student taking quiz)
 */
const getQuizById = async (quizId) => {
    const quiz = await Quiz.findById(quizId)
        .populate('course_id', 'title')
        .populate('lesson_id', 'title')
        .lean();

    if (!quiz) {
        throw new Error('Quiz not found');
    }

    const questions = await Question.find({ quiz_id: quizId }).sort({ order: 1 }).lean();

    const formattedQuestions = questions.map(q => {
        const correctIndex = q.options.findIndex(opt => opt.is_correct === true);

        return {
            _id: q._id,
            question: q.question_text,
            options: q.options.map(opt => opt.text),
            correctAnswer: correctIndex > -1 ? correctIndex : 0,
            points: q.points
        };
    });

    return {
        ...quiz,
        questions: formattedQuestions
    };
};

/**
 * Submit quiz (Grade quiz)
 */
const submitQuiz = async (quizId, answers, userId) => {
    // Get original questions (sort order to match index)
    const dbQuestions = await Question.find({ quiz_id: quizId }).sort({ order: 1 });

    if (!dbQuestions.length) {
        throw new Error('Questions not found');
    }

    let totalScore = 0;
    let earnedScore = 0;
    let correctCount = 0;

    const submissionAnswers = [];

    const resultDetails = dbQuestions.map((q, index) => {
        totalScore += q.points;

        const userAns = answers.find(a => a.questionIndex === index);
        const userSelectedOptIndex = userAns ? userAns.selectedOption : -1;

        let isCorrect = false;
        let pointsEarned = 0;
        let correctAnswerIndex = -1;
        let userAnswerText = "";

        q.options.forEach((opt, idx) => {
            if (opt.is_correct) correctAnswerIndex = idx;
            if (idx === userSelectedOptIndex) userAnswerText = opt.text;
        });

        if (userSelectedOptIndex !== -1 && q.options[userSelectedOptIndex]) {
            if (q.options[userSelectedOptIndex].is_correct) {
                isCorrect = true;
                pointsEarned = q.points;
                earnedScore += q.points;
                correctCount++;
            }
        }

        submissionAnswers.push({
            question_id: q._id,
            answer: userAnswerText || "No Answer",
            is_correct: isCorrect,
            points_earned: pointsEarned
        });

        return {
            questionIndex: index,
            isCorrect: isCorrect,
            userChoice: userSelectedOptIndex,
            correctAnswer: correctAnswerIndex
        };
    });

    const finalScore = totalScore > 0
        ? Math.round((earnedScore / totalScore) * 100)
        : 0;

    const quizInfo = await Quiz.findById(quizId);
    const passed = finalScore >= (quizInfo.passing_score || 70);

    // Get last submission to calculate attempt number
    const lastSubmission = await Submission.findOne({
        student_id: userId,
        quiz_id: quizId
    }).sort({ attempt_number: -1 });

    const newAttemptNumber = lastSubmission ? lastSubmission.attempt_number + 1 : 1;

    // Create Submission
    await Submission.create({
        quiz_id: quizId,
        student_id: userId,
        answers: submissionAnswers,
        score: finalScore,
        total_points: totalScore,
        attempt_number: newAttemptNumber,
    });

    return {
        score: finalScore,
        totalQuestions: dbQuestions.length,
        correctCount: correctCount,
        passed: passed,
        details: resultDetails
    };
};

/**
 * Create quiz (For Instructor)
 */
const createQuiz = async (quizData) => {
    const { title, course_id, lesson_id, description, time_limit, questions } = quizData;

    // Create Quiz
    const newQuiz = await Quiz.create({
        title,
        course_id,
        lesson_id,
        description,
        time_limit
    });

    // Create Questions
    if (questions && questions.length > 0) {
        const questionDocs = questions.map((q, index) => ({
            quiz_id: newQuiz._id,
            question_text: q.question,
            question_type: 'multiple_choice',
            options: q.options.map((optText, optIndex) => ({
                text: optText,
                is_correct: optIndex === q.correctAnswer
            })),
            correct_answer: q.options[q.correctAnswer] || "",
            order: index + 1,
            points: 1
        }));

        await Question.insertMany(questionDocs);
    }

    return newQuiz;
};

/**
 * Update quiz (For Instructor)
 */
const updateQuiz = async (quizId, quizData) => {
    const { title, course_id, lesson_id, description, time_limit, questions } = quizData;

    // Update basic quiz info
    const updatedQuiz = await Quiz.findByIdAndUpdate(
        quizId,
        {
            title,
            course_id,
            lesson_id,
            description,
            time_limit
        },
        { new: true }
    );

    if (!updatedQuiz) {
        throw new Error('Quiz not found');
    }

    // Update questions (delete old and create new)
    if (questions && questions.length > 0) {
        await Question.deleteMany({ quiz_id: quizId });

        const questionDocs = questions.map((q, index) => ({
            quiz_id: quizId,
            question_text: q.question,
            question_type: 'multiple_choice',
            options: q.options.map((optText, optIndex) => ({
                text: optText,
                is_correct: optIndex === q.correctAnswer
            })),
            correct_answer: q.options[q.correctAnswer] || "",
            order: index + 1,
            points: 1
        }));

        await Question.insertMany(questionDocs);
    }

    return updatedQuiz;
};

/**
 * Delete quiz
 */
const deleteQuiz = async (quizId) => {
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
        throw new Error('Quiz not found');
    }

    // Delete all related questions
    await Question.deleteMany({ quiz_id: quizId });

    // Optionally delete submissions (commented out to keep history)
    // await Submission.deleteMany({ quiz_id: quizId });

    return { message: 'Quiz deleted successfully' };
};

/**
 * Get my submissions
 */
const getMySubmissions = async (userId, courseId = null) => {
    let filter = { student_id: userId };

    if (courseId) {
        const quizzesInCourse = await Quiz.find({ course_id: courseId }).select('_id');
        const quizIds = quizzesInCourse.map(q => q._id);
        filter.quiz_id = { $in: quizIds };
    }

    const submissions = await Submission.find(filter)
        .sort({ createdAt: -1 })
        .populate('quiz_id', 'title course_id')
        .limit(20);

    return submissions;
};

/**
 * Generate MCQ from lesson text (AI draft)
 */
const generateMCQFromText = async (text) => {
    if (!text || typeof text !== 'string' || text.length < 20) {
        throw new Error('Missing or invalid lesson text.');
    }

    const prompt = `Given the following lesson text, generate 5-10 multiple choice questions (MCQ) in JSON array format. Each MCQ should have: question (string), options (array of 4 strings), answer (index of correct option, 0-3). Only return the JSON array, no explanation.\n\nLesson text:\n${text}`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    let mcqs = [];
    try {
        const cleanText = aiText.replace(/```json|```/g, '').trim();
        mcqs = JSON.parse(cleanText);
    } catch (e) {
        throw new Error('AI response is not valid JSON');
    }

    return mcqs;
};

module.exports = {
    getQuizzes,
    getQuizById,
    submitQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getMySubmissions,
    generateMCQFromText,
};

