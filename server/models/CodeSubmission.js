const mongoose = require('mongoose');

const CodeSubmissionSchema = new mongoose.Schema({
    exercise_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProgrammingExercise',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    language: {
        type: String,
        enum: ['python', 'javascript'],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    test_results: [{
        test_case_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        passed: {
            type: Boolean,
            default: false
        },
        output: {
            type: String,
            default: ''
        },
        expected_output: {
            type: String,
            default: ''
        },
        error: {
            type: String,
            default: ''
        },
        execution_time: {
            type: Number,
            default: 0 // milliseconds
        },
        points_earned: {
            type: Number,
            default: 0
        }
    }],
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    passed: {
        type: Boolean,
        default: false
    },
    attempt_number: {
        type: Number,
        default: 1
    },
    execution_time: {
        type: Number,
        default: 0 // Total execution time in milliseconds
    }
}, {
    timestamps: true
});

// Index for faster queries
CodeSubmissionSchema.index({ exercise_id: 1, student_id: 1, attempt_number: 1 });
CodeSubmissionSchema.index({ student_id: 1, lesson_id: 1 });
CodeSubmissionSchema.index({ createdAt: -1 });

const CodeSubmission = mongoose.model('CodeSubmission', CodeSubmissionSchema);
module.exports = CodeSubmission;

