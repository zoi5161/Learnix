const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    quiz_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Quiz', 
        required: true 
    },
    question_text: { 
        type: String, 
        required: true 
    },
    question_type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
        default: 'multiple_choice'
    },
    options: [{
        text: { type: String, required: true },
        is_correct: { type: Boolean, default: false }
    }], // For multiple choice questions
    correct_answer: { 
        type: String, 
        required: true 
    }, // For other question types or correct option text
    explanation: {
        type: String,
        default: ''
    },
    points: {
        type: Number,
        default: 1,
        min: 1
    },
    order: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    timestamps: true
});

// Ensure unique order within a quiz
QuestionSchema.index({ quiz_id: 1, order: 1 }, { unique: true });

const Question = mongoose.model('Question', QuestionSchema);
module.exports = Question;
