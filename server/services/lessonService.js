const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

/**
 * Get lesson content (only for enrolled students or free lessons)
 */
const getLesson = async (courseId, lessonId, studentId = null) => {
    // Get lesson
    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
        throw new Error('Lesson not found');
    }

    // Check if lesson belongs to course
    if (lesson.course_id.toString() !== courseId) {
        throw new Error('Lesson does not belong to this course');
    }

    // Get course
    const course = await Course.findById(courseId).lean();
    if (!course || course.status !== 'published') {
        throw new Error('Course not found or not published');
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
        throw new Error('Access denied. Please enroll in the course to view this lesson.');
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
            progress.last_accessed_at = new Date();
            await progress.save();
        }
    }

    return {
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
    };
};

/**
 * Update lesson progress
 */
const updateProgress = async (courseId, lessonId, studentId, updateData) => {
    const { status, completion_percentage, time_spent, notes } = updateData;

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId,
        status: { $in: ['enrolled', 'completed'] }
    });

    if (!enrollment) {
        throw new Error('Not enrolled in this course');
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

    return progress;
};

/**
 * Get all lessons for a course (for enrolled students)
 */
const getCourseLessons = async (courseId, studentId) => {
    // Verify enrollment
    const enrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId,
        status: { $in: ['enrolled', 'completed'] }
    });

    if (!enrollment) {
        throw new Error('Not enrolled in this course');
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

    return lessonsWithProgress;
};

// ============================================================
// INSTRUCTOR / ADMIN OPERATIONS
// ============================================================

/**
 * Get all lessons (For Instructor/Admin - No enrollment check required)
 */
const getLessonsByCourse = async (courseId) => {
    // Check course existence
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    const lessons = await Lesson.find({ course_id: courseId }).sort('order');
    return lessons;
};

/**
 * Create Lesson
 */
const createLesson = async (courseId, lessonData, userId, userRole) => {
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (userRole !== 'admin' && userRole !== 'instructor' && course.instructor_id.toString() !== userId) {
        throw new Error('Permission denied');
    }

    // Auto-calculate order (Append to end)
    const lastLesson = await Lesson.findOne({ course_id: courseId }).sort('-order');
    const newOrder = lastLesson ? lastLesson.order + 1 : 1;

    const newLesson = await Lesson.create({
        course_id: courseId,
        ...lessonData,
        order: newOrder
    });

    return newLesson;
};

/**
 * Update Lesson
 */
const updateLesson = async (courseId, lessonId, updateData, userId, userRole) => {
    // Verify Course & Ownership
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (userRole !== 'admin' && userRole !== 'instructor' && course.instructor_id.toString() !== userId) {
        throw new Error('Permission denied');
    }

    const updatedLesson = await Lesson.findOneAndUpdate(
        { _id: lessonId, course_id: courseId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedLesson) {
        throw new Error('Lesson not found');
    }

    return updatedLesson;
};

/**
 * Delete Lesson
 */
const deleteLesson = async (courseId, lessonId, userId, userRole) => {
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (userRole !== 'admin' && userRole !== 'instructor' && course.instructor_id.toString() !== userId) {
        throw new Error('Permission denied');
    }

    const deletedLesson = await Lesson.findOneAndDelete({ _id: lessonId, course_id: courseId });
    if (!deletedLesson) {
        throw new Error('Lesson not found');
    }

    // Also delete associated progress
    await Progress.deleteMany({ lesson_id: lessonId });

    return deletedLesson;
};

/**
 * Reorder Lessons
 */
const reorderLessons = async (courseId, lessons, userId, userRole) => {
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (userRole !== 'admin' && userRole !== 'instructor' && course.instructor_id.toString() !== userId) {
        throw new Error('Permission denied');
    }

    // Use Promise.all to update concurrently
    await Promise.all(lessons.map(item =>
        Lesson.updateOne({ _id: item.lessonId, course_id: courseId }, { order: item.order })
    ));

    return { message: 'Lessons reordered successfully' };
};

module.exports = {
    getLesson,
    updateProgress,
    getCourseLessons,
    getLessonsByCourse,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
};

