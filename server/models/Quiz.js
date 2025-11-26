const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
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
        default: ''
    },
    time_limit: {
        type: Number, // in minutes
        default: 0 // 0 means no time limit
    },
    attempts_allowed: {
        type: Number,
        default: 3
    },
    passing_score: {
        type: Number,
        min: 0,
        max: 100,
        default: 70
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});


// Virtual for getting questions count
QuizSchema.virtual('questionsCount', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'quiz_id',
    count: true
});

const Quiz = mongoose.model('Quiz', QuizSchema);
module.exports = Quiz;
