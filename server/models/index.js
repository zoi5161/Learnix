// Export all models for easy importing
const User = require('./User');
const Course = require('./Course');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Submission = require('./Submission');
const Progress = require('./Progress');
const Review = require('./Review');

module.exports = {
    User,
    Course,
    Lesson,
    Enrollment,
    Quiz,
    Question,
    Submission,
    Progress,
    Review
};
