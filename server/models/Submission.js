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
    answers: [{
        question_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Question', 
            required: true 
        },
        answer: { 
            type: String, 
            required: true 
        }, // Student's answer
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
        min: 0, 
        max: 100,
        default: 0 
    },
    total_points: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

// Calculate score before saving
SubmissionSchema.pre('save', function(next) {
    if (this.total_points > 0) {
        this.score = Math.round((this.earned_points / this.total_points) * 100);
    }
    next();
});

// Index for finding user's submissions
SubmissionSchema.index({ student_id: 1, quiz_id: 1, attempt_number: 1 }, { unique: true });

const Submission = mongoose.model('Submission', SubmissionSchema);
module.exports = Submission;
