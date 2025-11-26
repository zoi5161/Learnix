const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    course_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    lesson_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lesson', 
        required: true 
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    completion_percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    time_spent: {
        type: Number, // in seconds
        default: 0
    },
    last_accessed_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Update completed_at when status changes to completed
ProgressSchema.pre('save', function(next) {
    if (this.status === 'completed' && !this.completed_at) {
        this.completed_at = new Date();
        this.completion_percentage = 100;
    }
    
    this.last_accessed_at = new Date();
    next();
});

// Ensure unique progress record per student, course, and lesson
ProgressSchema.index({ student_id: 1, course_id: 1, lesson_id: 1 }, { unique: true });

const Progress = mongoose.model('Progress', ProgressSchema);
module.exports = Progress;
