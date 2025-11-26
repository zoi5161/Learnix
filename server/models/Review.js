const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    course_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
}, {
    timestamps: true
});

// Ensure a user can only review a course once
ReviewSchema.index({ course_id: 1, user_id: 1 }, { unique: true });

// Index for finding course reviews
ReviewSchema.index({ course_id: 1, status: 1, created_at: -1 });

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
