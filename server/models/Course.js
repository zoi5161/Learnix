const mongoose = require('mongoose');

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
}, {
    timestamps: true
});


// Virtual for getting lessons count
CourseSchema.virtual('lessonsCount', {
    ref: 'Lesson',
    localField: '_id',
    foreignField: 'course_id',
    count: true
});

// Virtual for getting enrollments count
CourseSchema.virtual('enrollmentsCount', {
    ref: 'Enrollment',
    localField: '_id',
    foreignField: 'course_id',
    count: true
});

const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;
