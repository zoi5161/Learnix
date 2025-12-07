const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    quiz_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Quiz', 
        required: true 
    },
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Thêm field này để index unique hoạt động đúng
    attempt_number: {
        type: Number,
        default: 1
    },
    answers: [{
        question_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Question', 
            required: true 
        },
        answer: { 
            type: String, // Lưu text đáp án hoặc index dạng string
            required: true 
        },
        is_correct: {
            type: Boolean,
            default: false
        },
        points_earned: {
            type: Number,
            default: 0
        }
    }],
    score: { 
        type: Number, 
        default: 0 
    },
    total_points: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

// Index: Mỗi user chỉ được làm 1 lần cho mỗi attempt (VD: lần 1, lần 2...)
SubmissionSchema.index({ student_id: 1, quiz_id: 1, attempt_number: 1 });

const Submission = mongoose.model('Submission', SubmissionSchema);
module.exports = Submission;