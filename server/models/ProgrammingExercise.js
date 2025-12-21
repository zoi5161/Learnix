const mongoose = require('mongoose');

const ProgrammingExerciseSchema = new mongoose.Schema({
    lesson_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
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
    starter_code: {
        python: {
            type: String,
            default: ''
        },
        javascript: {
            type: String,
            default: ''
        }
    },
    test_cases: [{
        input: {
            type: String,
            required: true
        },
        expected_output: {
            type: String,
            required: true
        },
        is_hidden: {
            type: Boolean,
            default: false
        },
        points: {
            type: Number,
            default: 1,
            min: 0
        },
        description: {
            type: String,
            default: ''
        }
    }],
    languages: [{
        type: String,
        enum: ['python', 'javascript'],
        required: true
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'easy'
    },
    time_limit: {
        type: Number,
        default: 5, // seconds
        min: 1,
        max: 30
    },
    memory_limit: {
        type: Number,
        default: 128, // MB
        min: 64,
        max: 512
    },
    is_active: {
        type: Boolean,
        default: true
    },
    function_name: {
        type: String,
        default: 'solution',
        trim: true
    },
    input_format: {
        type: String,
        enum: ['json', 'space_separated', 'line_separated'],
        default: 'json'
    }
}, {
    timestamps: true
});

// Index for faster queries
ProgrammingExerciseSchema.index({ lesson_id: 1 });
ProgrammingExerciseSchema.index({ is_active: 1 });

const ProgrammingExercise = mongoose.model('ProgrammingExercise', ProgrammingExerciseSchema);
module.exports = ProgrammingExercise;

