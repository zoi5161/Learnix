const mongoose = require('mongoose');

// Cần import các Model liên quan để thực hiện xóa liên đới
const Lesson = require('./Lesson');
const Quiz = require('./Quiz'); 
const Question = require('./Question'); 
const Submission = require('./Submission'); 

const CourseSchema = new mongoose.Schema({
    instructor_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true 
    },
    level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'], 
        default: 'beginner' 
    },
    is_premium: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: String, 
        enum: ['draft', 'published', 'archived'], 
        default: 'draft' 
    },
    thumbnail: {
        type: String, // URL to course image
        default: null
    },
    price: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        trim: true,
        default: 'general'
    },
    summary: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});


// Virtuals (Giữ nguyên)
CourseSchema.virtual('lessonsCount', {
    ref: 'Lesson',
    localField: '_id',
    foreignField: 'course_id',
    count: true
});

CourseSchema.virtual('enrollmentsCount', {
    ref: 'Enrollment',
    localField: '_id',
    foreignField: 'course_id',
    count: true
});

// Index
CourseSchema.index({ title: 'text', description: 'text', summary: 'text', tags: 'text' });
CourseSchema.index({ category: 1 });
CourseSchema.index({ status: 1, createdAt: -1 });

// ----------------------------------------------------------------------------------
// 🚀 MIDDLEWARE XÓA LIÊN ĐỚI (CASCADE DELETE HOOK) 
// Chạy trước khi Course bị xóa (sử dụng findOneAndDelete trong Controller)
CourseSchema.pre('findOneAndDelete', async function(next) {
    const courseId = this.getQuery()._id; // Lấy ID của Course sắp bị xóa

    try {
        console.log(`[CASCADE DELETE] Bắt đầu xóa Lesson và Quiz liên quan cho Course ID: ${courseId}`);
        
        // 1. Tìm TẤT CẢ Lesson thuộc Course này
        const lessons = await Lesson.find({ course_id: courseId });
        const lessonIds = lessons.map(lesson => lesson._id);

        if (lessonIds.length > 0) {
            // 2. Tìm TẤT CẢ Quiz liên quan đến các Lesson này
            const quizzes = await Quiz.find({ lesson_id: { $in: lessonIds } });
            const quizIds = quizzes.map(quiz => quiz._id);

            // 3. Xóa các tài liệu cấp dưới của Quiz (Question và Submission)
            if (quizIds.length > 0) {
                await Question.deleteMany({ quiz_id: { $in: quizIds } });
                await Submission.deleteMany({ quiz_id: { $in: quizIds } });
                console.log(`[CASCADE DELETE] Đã xóa ${quizIds.length} Quiz, Questions và Submissions.`);
            }
            
            // 4. Xóa các Quiz Document
            await Quiz.deleteMany({ lesson_id: { $in: lessonIds } });

            // 5. Xóa các Lesson Document
            await Lesson.deleteMany({ course_id: courseId });
            console.log(`[CASCADE DELETE] Đã xóa ${lessonIds.length} Lesson.`);
        }

        next();
    } catch (error) {
        console.error('[CASCADE DELETE ERROR] Lỗi khi thực hiện xóa liên đới:', error);
        next(error);
    }
});
// ----------------------------------------------------------------------------------

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;