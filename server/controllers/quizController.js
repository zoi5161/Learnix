const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Submission = require('../models/Submission'); // Optional: Nếu bạn muốn lưu lịch sử
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
// ==============================================
// 1. GET ALL QUIZZES (Filter by course_id)
// ==============================================

// ==============================================
// 1. GET ALL QUIZZES (Filter by course_id)
// ==============================================
exports.getQuizzes = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = {};

        if (course_id) {
            query.course_id = course_id;
        }

        // 👇 Cấu hình populate an toàn hơn
        const quizzes = await Quiz.find(query)
            .populate({ path: 'course_id', select: 'title', strictPopulate: false }) // strictPopulate: false giúp tránh lỗi nếu ID không tìm thấy
            .populate({ path: 'lesson_id', select: 'title', strictPopulate: false })
            .sort({ createdAt: -1 })
            .lean();

        const formattedQuizzes = await Promise.all(quizzes.map(async (q) => {
            const questionCount = await Question.countDocuments({ quiz_id: q._id });

            // Xử lý an toàn nếu populate trả về null
            const courseData = q.course_id || {};
            const lessonData = q.lesson_id || {};

            return {
                ...q,
                id: q._id,
                questionsCount: questionCount,
                // Đảm bảo dữ liệu trả về luôn có structure đúng
                course_id: courseData,
                lesson_id: lessonData
            };
        }));

        res.status(200).json({
            success: true,
            data: {
                quizzes: formattedQuizzes
            }
        });
    } catch (error) {
        // 👇 Log lỗi ra terminal của server để bạn biết chính xác bị gì
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

        // Populate cả course và lesson để hiển thị tên nếu cần
        const quiz = await Quiz.findById(id)
            .populate('course_id', 'title')
            .populate('lesson_id', 'title')
            .lean();

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const questions = await Question.find({ quiz_id: id }).sort({ order: 1 }).lean();

        // 👇 SỬA ĐOẠN NÀY: Tính toán correctAnswer (index) để trả về cho Frontend
        const formattedQuestions = questions.map(q => {
            // Tìm index của option có is_correct = true
            const correctIndex = q.options.findIndex(opt => opt.is_correct === true);

            return {
                _id: q._id,
                question: q.question_text,
                options: q.options.map(opt => opt.text),
                correctAnswer: correctIndex > -1 ? correctIndex : 0, // Trả về index để Form hiển thị
                points: q.points
            };
        });

        res.status(200).json({
            success: true,
            data: {
                ...quiz,
                questions: formattedQuestions
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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

        // 1. Lấy câu hỏi gốc (sort order để khớp index)
        const dbQuestions = await Question.find({ quiz_id: quizId }).sort({ order: 1 });

        if (!dbQuestions.length) {
            return res.status(404).json({ success: false, message: 'Questions not found' });
        }

        let totalScore = 0; // Tổng điểm tối đa
        let earnedScore = 0; // Điểm user đạt được
        let correctCount = 0;

        // Mảng để lưu vào Submission
        const submissionAnswers = [];

        // 2. Chấm điểm & Chuẩn bị dữ liệu lưu
        const resultDetails = dbQuestions.map((q, index) => {
            totalScore += q.points;

            const userAns = answers.find(a => a.questionIndex === index);
            const userSelectedOptIndex = userAns ? userAns.selectedOption : -1;

            let isCorrect = false;
            let pointsEarned = 0;
            let correctAnswerIndex = -1;
            let userAnswerText = "";

            // Tìm index đúng và Text đáp án user chọn
            q.options.forEach((opt, idx) => {
                if (opt.is_correct) correctAnswerIndex = idx;
                if (idx === userSelectedOptIndex) userAnswerText = opt.text;
            });

            // Logic chấm điểm
            if (userSelectedOptIndex !== -1 && q.options[userSelectedOptIndex]) {
                if (q.options[userSelectedOptIndex].is_correct) {
                    isCorrect = true;
                    pointsEarned = q.points;
                    earnedScore += q.points;
                    correctCount++;
                }
            }

            // Đẩy vào mảng để lưu xuống DB (Khớp với Schema Submission)
            submissionAnswers.push({
                question_id: q._id,
                answer: userAnswerText || "No Answer", // Lưu text đáp án
                is_correct: isCorrect,
                points_earned: pointsEarned
            });

            // Trả về cho FE hiển thị
            return {
                questionIndex: index,
                isCorrect: isCorrect,
                userChoice: userSelectedOptIndex,
                correctAnswer: correctAnswerIndex
            };
        });

        // 3. Tính điểm hệ 100
        const finalScore = totalScore > 0
            ? Math.round((earnedScore / totalScore) * 100)
            : 0;

        const quizInfo = await Quiz.findById(quizId);
        const passed = finalScore >= (quizInfo.passing_score || 70);

        // 4. 🔥 LƯU VÀO DB (SUBMISSION) 🔥
        // Kiểm tra xem đã làm chưa (nếu chỉ cho làm 1 lần)
        const lastSubmission = await Submission.findOne({
            student_id: userId,
            quiz_id: quizId
        }).sort({ attempt_number: -1 }); // Sắp xếp giảm dần để lấy số lớn nhất

        // 2. Tính số lần thi mới
        const newAttemptNumber = lastSubmission ? lastSubmission.attempt_number + 1 : 1;
        // Tạo Submission mới
        await Submission.create({
            quiz_id: quizId,
            student_id: userId,
            answers: submissionAnswers, // Mảng chi tiết
            score: finalScore,          // Điểm % (0-100)
            total_points: totalScore,   // Tổng điểm gốc của đề
            attempt_number: newAttemptNumber,         // Tạm thời fix cứng là 1, sau này bạn có thể count document để tăng lên
        });

        // 5. Trả kết quả
        res.status(200).json({
            success: true,
            data: {
                score: finalScore,
                totalQuestions: dbQuestions.length,
                correctCount: correctCount,
                passed: passed,
                details: resultDetails
            }
        });

    } catch (error) {
        console.error("Submit Error:", error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ==============================================
// 4. CREATE QUIZ (Cho Instructor)
// ==============================================
exports.createQuiz = async (req, res) => {
    try {
        // 👇 Đã thêm lesson_id vào đây để sửa lỗi validation
        const { title, course_id, lesson_id, description, time_limit, questions } = req.body;

        // B1: Tạo Quiz
        const newQuiz = await Quiz.create({
            title,
            course_id,
            lesson_id, // <--- Field này bắt buộc nếu schema yêu cầu
            description,
            time_limit
        });

        // B2: Tạo từng Question và link với Quiz vừa tạo
        if (questions && questions.length > 0) {
            const questionDocs = questions.map((q, index) => ({
                quiz_id: newQuiz._id,
                question_text: q.question, // Mapping từ FE (question) sang DB (question_text)
                question_type: 'multiple_choice',
                options: q.options.map((optText, optIndex) => ({
                    text: optText,
                    is_correct: optIndex === q.correctAnswer // FE gửi index đúng, DB lưu boolean
                })),
                correct_answer: q.options[q.correctAnswer] || "", // Lưu text đáp án đúng (cho chắc chắn)
                order: index + 1,
                points: 1
            }));

            await Question.insertMany(questionDocs);
        }

        res.status(201).json({ success: true, data: newQuiz });
    } catch (error) {
        console.error("Create Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ... (Các hàm getQuizzes, createQuiz... ở trên giữ nguyên)

// ==============================================
// 5. UPDATE QUIZ (Cho Instructor)
// ==============================================
exports.updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, course_id, lesson_id, description, time_limit, questions } = req.body;

        // B1: Cập nhật thông tin cơ bản của Quiz
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            id,
            {
                title,
                course_id,
                lesson_id,
                description,
                time_limit
            },
            { new: true } // Trả về data mới sau khi update
        );

        if (!updatedQuiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // B2: Cập nhật câu hỏi (Question)
        // Cách đơn giản nhất: Xóa hết câu hỏi cũ và tạo lại câu hỏi mới
        // (Để xử lý cả việc user xóa câu hỏi, sửa câu hỏi, hoặc đổi thứ tự)
        if (questions && questions.length > 0) {
            // 1. Xóa hết câu hỏi cũ của quiz này
            await Question.deleteMany({ quiz_id: id });

            // 2. Tạo lại danh sách câu hỏi mới
            const questionDocs = questions.map((q, index) => ({
                quiz_id: id,
                question_text: q.question, // Mapping từ FE
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

        res.status(200).json({ success: true, data: updatedQuiz });
    } catch (error) {
        console.error("Update Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================================
// 6. DELETE QUIZ
// ==============================================
exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        // B1: Xóa Quiz
        const quiz = await Quiz.findByIdAndDelete(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // B2: Xóa tất cả câu hỏi liên quan
        await Question.deleteMany({ quiz_id: id });

        // B3: (Tuỳ chọn) Xóa lịch sử làm bài Submission liên quan
        // await Submission.deleteMany({ quiz_id: id });

        res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error("Delete Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// backend/controllers/quizController.js

exports.getMySubmissions = async (req, res) => {
    try {
        const { course_id } = req.query;
        const userId = req.user.id;

        let filter = { student_id: userId };

        // Nếu có course_id thì lọc theo course (Logic cũ)
        // Nếu KHÔNG có course_id, ta lấy TẤT CẢ (Logic mới cho Dashboard)
        if (course_id) {
            const quizzesInCourse = await Quiz.find({ course_id: course_id }).select('_id');
            const quizIds = quizzesInCourse.map(q => q._id);
            filter.quiz_id = { $in: quizIds };
        }

        const submissions = await Submission.find(filter)
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .populate('quiz_id', 'title course_id') // Populate thêm course_id để biết quiz thuộc khóa nào
            .limit(20); // Chỉ lấy 20 bài gần nhất cho nhẹ

        res.status(200).json({ success: true, data: submissions });

    } catch (error) {
        console.error("Get My Submissions Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};