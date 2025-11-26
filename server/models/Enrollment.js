const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
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
    status: { 
        type: String, 
        enum: ['enrolled', 'completed', 'dropped', 'suspended'], 
        default: 'enrolled' 
    }
}, {
    timestamps: true
});


// Ensure a student can only enroll once in a course
EnrollmentSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
module.exports = Enrollment;
