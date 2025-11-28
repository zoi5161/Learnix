const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    course_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    content_type: { 
        type: String, 
        enum: ['video', 'text', 'pdf', 'quiz', 'assignment'], 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    }, // URL for video/pdf, or text content
    description: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    is_free: {
        type: Boolean,
        default: false // Premium lessons require course enrollment
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
}, {
    timestamps: true
});

// Ensure unique order within a course
LessonSchema.index({ course_id: 1, order: 1 }, { unique: true });

const Lesson = mongoose.model('Lesson', LessonSchema);
module.exports = Lesson;
