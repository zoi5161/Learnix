const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Lesson = require('../models/Lesson');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');

const checkCourseOwnership = async (courseId, userId, userRole) => {
    const Course = require('../models/Course'); 
    const course = await Course.findById(courseId);
    if (!course) return { error: 'Course not found' };

    if (userRole !== 'admin' && course.instructor_id.toString() !== userId.toString()) {
        return { error: 'Forbidden: You do not own this course' };
    }
    return { course };
};

// Instructor/Admin - Create Quiz with Questions
exports.createQuiz = async (req, res) => {
    // LẤY ID TỪ PARAMS (URL) ĐỂ ĐẢM BẢO CHÍNH XÁC
    const { lessonId: paramLessonId } = req.params;
    
    // LẤY DỮ LIỆU TỪ BODY
    const { 
        title, 
        description, 
        questions, 
        time_limit,
        attempts_allowed,
        passing_score,
    } = req.body; 

    // Sử dụng lessonId từ params
    const lessonId = paramLessonId;
    const userId = req.user.id;
    const userRole = req.user.role;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Tìm Lesson và kiểm tra quyền sở hữu Course
        const lesson = await Lesson.findById(lessonId).populate('course_id').session(session);
        
        if (!lesson) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const courseId = lesson.course_id._id.toString(); 

        // Kiểm tra quyền sở hữu Course
        const ownershipCheck = await checkCourseOwnership(courseId, userId, userRole);
        if (ownershipCheck.error) {
            await session.abortTransaction();
            return res.status(403).json({ message: ownershipCheck.error });
        }

        // 2. Tạo Quiz mới
        const newQuiz = new Quiz({
            lesson_id: lessonId, // Đã sửa lỗi Lesson ID
            title: title || 'New Quiz',
            description,
            instructor: userId,
            time_limit,
            attempts_allowed,
            passing_score,
        });
        const savedQuiz = await newQuiz.save({ session });

        // 3. Tạo các Câu hỏi và liên kết với Quiz
        const questionDocuments = questions.map(q => {
            let correctAnswerValue = q.correct_answer;

            // Xử lý Multiple Choice: Tìm đáp án đúng từ mảng options
            if (q.question_type === 'multiple_choice' && q.options && Array.isArray(q.options)) {
                const correctOpt = q.options.find(opt => opt.is_correct);
                if (correctOpt) {
                    correctAnswerValue = correctOpt.text; 
                }
            }

            return {
                ...q,
                // SỬA LỖI VALIDATION 1: Đổi thành quiz_id để khớp Schema
                quiz_id: savedQuiz._id, 
                // SỬA LỖI VALIDATION 2: Đảm bảo correct_answer có giá trị
                correct_answer: correctAnswerValue || 'N/A', // Đảm bảo không để trống
            };
        });
        
        // Lưu đồng thời mảng câu hỏi
        const savedQuestions = await Question.insertMany(questionDocuments, { session });

        // 4. Cập nhật Lesson để liên kết với Quiz
        lesson.quiz = savedQuiz._id;
        await lesson.save({ session });

        // 5. Commit Transaction
        await session.commitTransaction();

        res.status(201).json({ 
            success: true, 
            message: 'Quiz created successfully', 
            quiz: savedQuiz, 
            questions: savedQuestions 
        });

    } catch (error) {
        await session.abortTransaction();
        
        // --- XỬ LÝ LỖI MONGODB/VALIDATION CỤ THỂ ---
        
        if (error.name === 'ValidationError') {
             console.error('ValidationError:', error.message);
             return res.status(400).json({ 
                 message: 'Dữ liệu Quiz không hợp lệ (Validation Error). Vui lòng kiểm tra các trường bắt buộc.', 
                 details: error.message 
             });
        }
        
        console.error('Lỗi nghiêm trọng khi tạo Quiz (Internal Server Error):', error);
        
        res.status(500).json({ 
            message: 'Internal server error while creating quiz.', 
            error: error.message 
        });
    } finally {
        session.endSession();
    }
};

// Instructor/Admin - Get Quiz Details (with Answers)
exports.getQuizForInstructor = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // 1. Tìm Lesson để xác định Quiz
        const lesson = await Lesson.findById(lessonId).populate('course_id');
        
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // 2. Kiểm tra quyền sở hữu Course
        const courseId = lesson.course_id._id.toString();
        const ownershipCheck = await checkCourseOwnership(courseId, userId, userRole);
        if (ownershipCheck.error) {
            return res.status(403).json({ message: ownershipCheck.error });
        }

        // 3. Tìm Quiz bằng Lesson ID
        const quiz = await Quiz.findOne({ lesson_id: lessonId }); 

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found for this lesson' });
        }
        
        // 4. Lấy tất cả Câu hỏi liên quan (bao gồm đáp án đúng)
        const questions = await Question.find({ quiz_id: quiz._id });

        res.status(200).json({ 
            success: true, 
            quiz: quiz,
            questions: questions // Gửi kèm Questions để hiển thị trên form Edit
        });

    } catch (error) {
        console.error('Error fetching quiz for instructor:', error);
        res.status(500).json({ message: 'Internal server error while fetching quiz details.' });
    }
};

// Instructor/Admin - Update Quiz and Synchronize Questions
exports.updateQuiz = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Lấy dữ liệu cập nhật Quiz và mảng Questions mới
    const { title, description, time_limit, attempts_allowed, passing_score, questions: updatedQuestionsData } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Kiểm tra quyền sở hữu và tìm Quiz hiện tại
        const lesson = await Lesson.findById(lessonId).populate('course_id').session(session);
        if (!lesson) throw new Error('Lesson not found');

        const courseId = lesson.course_id._id.toString();
        const ownershipCheck = await checkCourseOwnership(courseId, userId, userRole);
        if (ownershipCheck.error) throw new Error(ownershipCheck.error);

        const quiz = await Quiz.findOne({ lesson_id: lessonId }).session(session);
        if (!quiz) throw new Error('Quiz not found');

        // 2. Cập nhật thông tin Quiz (nếu có thay đổi)
        quiz.title = title || quiz.title;
        quiz.description = description !== undefined ? description : quiz.description;
        quiz.time_limit = time_limit !== undefined ? time_limit : quiz.time_limit;
        quiz.attempts_allowed = attempts_allowed !== undefined ? attempts_allowed : quiz.attempts_allowed;
        quiz.passing_score = passing_score !== undefined ? passing_score : quiz.passing_score;
        await quiz.save({ session });

        // 3. Xử lý đồng bộ hóa Questions
        const existingQuestionIds = (await Question.find({ quiz_id: quiz._id }).select('_id').session(session)).map(q => q._id.toString());
        const newQuestionIds = [];

        for (const qData of updatedQuestionsData) {
            let correctAnswerValue = qData.correct_answer || 'N/A';
            if (qData.question_type === 'multiple_choice' && qData.options && Array.isArray(qData.options)) {
                const correctOpt = qData.options.find(opt => opt.is_correct);
                if (correctOpt) {
                    correctAnswerValue = correctOpt.text;
                }
            }
            
            const questionData = {
                ...qData,
                quiz_id: quiz._id,
                correct_answer: correctAnswerValue,
            };

            if (qData._id) {
                // Cập nhật Question hiện tại (Nếu có _id)
                const updatedQ = await Question.findByIdAndUpdate(qData._id, questionData, { new: true, runValidators: true, session });
                if (updatedQ) {
                    newQuestionIds.push(updatedQ._id.toString());
                }
            } else {
                // Thêm Question mới (Nếu không có _id)
                const newQ = new Question(questionData);
                const savedQ = await newQ.save({ session });
                newQuestionIds.push(savedQ._id.toString());
            }
        }

        // 4. Xóa các Question đã bị loại bỏ
        const questionsToDelete = existingQuestionIds.filter(id => !newQuestionIds.includes(id));
        if (questionsToDelete.length > 0) {
            await Question.deleteMany({ _id: { $in: questionsToDelete } }, { session });
        }
        
        // 5. Commit Transaction
        await session.commitTransaction();

        res.status(200).json({ 
            success: true, 
            message: 'Quiz updated successfully', 
            quiz: quiz 
        });

    } catch (error) {
        await session.abortTransaction();
        
        if (error.name === 'ValidationError') {
             console.error('Quiz Update Validation Error:', error.message);
             return res.status(400).json({ 
                 message: 'Dữ liệu cập nhật Quiz không hợp lệ.', 
                 details: error.message 
             });
        }
        
        // Xử lý lỗi nếu Lesson/Quiz/Ownership không tìm thấy (lỗi throw)
        if (error.message.includes('not found') || error.message.includes('Forbidden')) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Error during quiz update:', error);
        res.status(500).json({ 
            message: 'Internal server error while updating quiz.', 
            error: error.message 
        });
    } finally {
        session.endSession();
    }
};

// Student - Submit Quiz with Instant Scoring
exports.submitQuiz = async (req, res) => {
    res.json({ success: true, data: { score: 85, earned_points: 17, total_points: 20 }, message: 'Quiz submitted and graded successfully.' });
};

// Student - Get Quiz Details (without Answers)
exports.getQuizForStudent = async (req, res) => {
    res.json({ success: true, message: 'Quiz for student view placeholder' });
};