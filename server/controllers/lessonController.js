const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

// Get lesson content (only for enrolled students or free lessons)
exports.getLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user?.id;

        // Get lesson
        const lesson = await Lesson.findById(lessonId).lean();
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check if lesson belongs to course
        if (lesson.course_id.toString() !== courseId) {
            return res.status(400).json({
                success: false,
                message: 'Lesson does not belong to this course'
            });
        }

        // Get course
        const course = await Course.findById(courseId).lean();
        if (!course || course.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Course not found or not published'
            });
        }

        // Check access: free lesson or enrolled student
        let hasAccess = false;
        if (lesson.is_free) {
            hasAccess = true;
        } else if (studentId) {
            const enrollment = await Enrollment.findOne({
                student_id: studentId,
                course_id: courseId,
                status: { $in: ['enrolled', 'completed'] }
            });
            hasAccess = !!enrollment;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Please enroll in the course to view this lesson.'
            });
        }

        // Get all lessons in course for navigation
        const allLessons = await Lesson.find({ course_id: courseId })
            .sort('order')
            .select('title content_type order is_free')
            .lean();

        const currentIndex = allLessons.findIndex(l => l._id.toString() === lessonId);
        const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

        // Get or create progress if student is logged in
        let progress = null;
        if (studentId) {
            progress = await Progress.findOne({
                student_id: studentId,
                course_id: courseId,
                lesson_id: lessonId
            });

            if (!progress) {
                progress = await Progress.create({
                    student_id: studentId,
                    course_id: courseId,
                    lesson_id: lessonId,
                    status: 'in_progress',
                    last_accessed_at: new Date()
                });
            } else {
                // Update last accessed
                progress.last_accessed_at = new Date();
                await progress.save();
            }
        }

        res.json({
            success: true,
            data: {
                lesson: {
                    ...lesson,
                    progress: progress ? {
                        status: progress.status,
                        completion_percentage: progress.completion_percentage,
                        time_spent: progress.time_spent,
                        notes: progress.notes
                    } : null
                },
                course: {
                    _id: course._id,
                    title: course.title
                },
                navigation: {
                    prev: prevLesson ? {
                        _id: prevLesson._id,
                        title: prevLesson.title
                    } : null,
                    next: nextLesson ? {
                        _id: nextLesson._id,
                        title: nextLesson.title
                    } : null,
                    currentIndex: currentIndex + 1,
                    total: allLessons.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson',
            error: error.message
        });
    }
};

// Update lesson progress
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user.id;
        const { status, completion_percentage, time_spent, notes } = req.body;

        // Verify enrollment
        const enrollment = await Enrollment.findOne({
            student_id: studentId,
            course_id: courseId,
            status: { $in: ['enrolled', 'completed'] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        // Get or create progress
        let progress = await Progress.findOne({
            student_id: studentId,
            course_id: courseId,
            lesson_id: lessonId
        });

        if (!progress) {
            progress = await Progress.create({
                student_id: studentId,
                course_id: courseId,
                lesson_id: lessonId
            });
        }

        // Update progress
        if (status) progress.status = status;
        if (completion_percentage !== undefined) progress.completion_percentage = completion_percentage;
        if (time_spent !== undefined) progress.time_spent = time_spent;
        if (notes !== undefined) progress.notes = notes;

        await progress.save();

        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: { progress }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating progress',
            error: error.message
        });
    }
};

// Get all lessons for a course (for enrolled students)
exports.getCourseLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Verify enrollment
        const enrollment = await Enrollment.findOne({
            student_id: studentId,
            course_id: courseId,
            status: { $in: ['enrolled', 'completed'] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        // Get all lessons
        const lessons = await Lesson.find({ course_id: courseId })
            .sort('order')
            .select('title content_type description duration is_free order')
            .lean();

        // Get progress for each lesson
        const lessonsWithProgress = await Promise.all(
            lessons.map(async (lesson) => {
                const progress = await Progress.findOne({
                    student_id: studentId,
                    course_id: courseId,
                    lesson_id: lesson._id
                });

                return {
                    ...lesson,
                    progress: progress ? {
                        status: progress.status,
                        completion_percentage: progress.completion_percentage,
                        time_spent: progress.time_spent
                    } : {
                        status: 'not_started',
                        completion_percentage: 0,
                        time_spent: 0
                    }
                };
            })
        );

        res.json({
            success: true,
            data: { lessons: lessonsWithProgress }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
};

