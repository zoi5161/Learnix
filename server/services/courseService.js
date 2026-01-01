const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// ============================================================
// PUBLIC OPERATIONS (READ ONLY)
// ============================================================

/**
 * Get all published courses (public)
 */
const getCourses = async (queryParams) => {
    const {
        page = 1,
        limit = 12,
        category,
        tag,
        level,
        search,
        sort = 'createdAt',
        order = 'desc',
        status
    } = queryParams;

    const query = {};

    if (status && status !== 'all') {
        query.status = status;
    }

    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    if (level) query.level = level;
    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
            { title: regex },
            { description: regex },
            { summary: regex }
        ];
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    sortOptions['_id'] = 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let coursesQuery = Course.find(query)
        .populate('instructor_id', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOptions);

    const courses = await coursesQuery.lean();

    const coursesWithCounts = await Promise.all(
        courses.map(async (course) => {
            const enrollmentsCount = await Enrollment.countDocuments({ 
                course_id: course._id,
                status: { $in: ['enrolled', 'completed'] } 
            });
            const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
            return { ...course, enrollmentsCount, lessonsCount };
        })
    );

    const total = await Course.countDocuments(query);

    return {
        courses: coursesWithCounts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

/**
 * Get single course by ID (public)
 */
const getCourseById = async (courseId, userId = null) => {
    const course = await Course.findById(courseId)
        .populate('instructor_id', 'name email')
        .lean();

    if (!course) {
        throw new Error('Course not found');
    }

    // Check if user has permission to view unpublished course
    if (course.status !== 'published' && userId) {
        const user = await User.findById(userId);
        const isOwnerOrAdmin = user && (
            user.role === 'admin' ||
            user.role === 'instructor' ||
            course.instructor_id?._id.toString() === userId.toString()
        );

        if (!isOwnerOrAdmin) {
            throw new Error('Course not found');
        }
    } else if (course.status !== 'published' && !userId) {
        throw new Error('Course not found');
    }

    const enrollmentsCount = await Enrollment.countDocuments({
        course_id: courseId,
        status: { $in: ['enrolled', 'completed'] }
    });
    const lessonsCount = await Lesson.countDocuments({ course_id: courseId });

    const isEnrolled = userId ? await Enrollment.findOne({
        student_id: userId,
        course_id: courseId,
        status: { $in: ['enrolled', 'completed'] }
    }) : null;

    const lessons = await Lesson.find({ course_id: courseId })
        .sort('order')
        .select('title content_type description duration is_free order')
        .lean();

    return {
        course: { ...course, enrollmentsCount, lessonsCount, lessons },
        isEnrolled: !!isEnrolled
    };
};

/**
 * Get categories (public)
 */
const getCategories = async () => {
    const categories = await Course.distinct('category', { status: 'published' });
    return categories.filter(cat => cat && cat.trim() !== '');
};

/**
 * Get trending tags (public)
 */
const getTrendingTags = async (limit = 10) => {
    const courses = await Course.find({ status: 'published' }).select('tags').lean();

    const tagCounts = {};
    courses.forEach(course => {
        if (course.tags && Array.isArray(course.tags)) {
            course.tags.forEach(tag => {
                if (tag && tag.trim() !== '') {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            });
        }
    });

    const trendingTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

    return trendingTags;
};

/**
 * Search courses (public)
 */
const searchCourses = async (searchQuery, page = 1, limit = 12) => {
    if (!searchQuery || searchQuery.trim() === '') {
        throw new Error('Search query is required');
    }

    const regex = new RegExp(searchQuery, 'i');
    const query = {
        status: 'published',
        $or: [
            { title: regex },
            { description: regex },
            { summary: regex }
        ]
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
        .populate('instructor_id', 'name email')
        .select('-description')
        .sort({ createdAt: -1, _id: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    const coursesWithCounts = await Promise.all(
        courses.map(async (course) => {
            const enrollmentsCount = await Enrollment.countDocuments({ 
                course_id: course._id,
                status: { $in: ['enrolled', 'completed'] } 
            });
            const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
            return { ...course, enrollmentsCount, lessonsCount };
        })
    );

    const total = await Course.countDocuments(query);

    return {
        courses: coursesWithCounts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
};

/**
 * Get suggested courses based on similar tags/categories (public)
 */
const getSuggestedCourses = async (courseId, limit = 6) => {
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    const currentCourse = await Course.findById(courseId).lean();
    if (!currentCourse) {
        throw new Error('Course not found');
    }

    const query = {
        _id: { $ne: courseId },
        status: 'published'
    };

    const matchConditions = [];

    if (currentCourse.tags && currentCourse.tags.length > 0) {
        matchConditions.push({ tags: { $in: currentCourse.tags } });
    }

    if (currentCourse.category && currentCourse.category.trim() !== '') {
        matchConditions.push({ category: currentCourse.category });
    }

    if (matchConditions.length > 0) {
        query.$or = matchConditions;
    }

    const suggestedCourses = await Course.find(query)
        .populate('instructor_id', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const coursesWithCounts = await Promise.all(
        suggestedCourses.map(async (course) => {
            const enrollmentsCount = await Enrollment.countDocuments({ 
                course_id: course._id,
                status: { $in: ['enrolled', 'completed'] } 
            });
            const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
            return { ...course, enrollmentsCount, lessonsCount };
        })
    );

    return coursesWithCounts;
};

// ============================================================
// ADMIN / INSTRUCTOR CRUD OPERATIONS
// ============================================================

/**
 * Create course
 */
const createCourse = async (courseData, user) => {
    // If instructor creates, automatically assign instructor_id and set status to draft
    if (user.role === 'instructor') {
        courseData.instructor_id = user._id;
        courseData.status = 'draft';
    } else if (user.role === 'admin') {
        if (!courseData.status) {
            courseData.status = 'draft';
        }
    }

    const newCourse = await Course.create(courseData);
    return newCourse;
};

/**
 * Update course
 */
const updateCourse = async (courseId, updateData, user) => {
    const course = await Course.findById(courseId);

    if (!course) {
        throw new Error('No course found with that ID');
    }

    const isOwner = course.instructor_id?.toString() === user._id.toString();
    if (user.role !== 'admin' && !isOwner) {
        throw new Error('You do not have permission to edit this course');
    }

    // Don't allow direct status updates via updateCourse
    if (updateData.status) {
        delete updateData.status;
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
        new: true,
        runValidators: true
    });

    return updatedCourse;
};

/**
 * Delete course
 */
const deleteCourse = async (courseId, user) => {
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('No course found with that ID');
    }

    const isOwner = course.instructor_id?.toString() === user._id.toString();
    if (user.role !== 'admin' && !isOwner) {
        throw new Error('You do not have permission to delete this course');
    }

    await Course.findByIdAndDelete(courseId);
    return null;
};

/**
 * Toggle publish/unpublish course
 */
const togglePublish = async (courseId, isPublish, user) => {
    const newStatus = isPublish ? 'published' : 'draft';

    const courseCheck = await Course.findById(courseId);
    if (!courseCheck) {
        throw new Error('No course found');
    }

    const isOwner = courseCheck.instructor_id?.toString() === user._id.toString();
    if (user.role !== 'admin' && !isOwner) {
        throw new Error('Permission denied');
    }

    const course = await Course.findByIdAndUpdate(
        courseId,
        { status: newStatus },
        { new: true }
    );

    return { course, message: isPublish ? 'Course published' : 'Course unpublished' };
};

/**
 * Assign instructor to course (Admin only)
 */
const assignInstructor = async (courseId, instructorId) => {
    const course = await Course.findByIdAndUpdate(
        courseId,
        { instructor_id: instructorId },
        { new: true }
    );

    if (!course) {
        throw new Error('No course found');
    }

    return course;
};

/**
 * Manage tags (Add/Remove)
 */
const manageTags = async (courseId, tag, isAdd, user) => {
    const courseCheck = await Course.findById(courseId);
    if (!courseCheck) {
        throw new Error('No course found');
    }

    const isOwner = courseCheck.instructor_id?.toString() === user._id.toString();
    if (user.role !== 'admin' && !isOwner) {
        throw new Error('Permission denied');
    }

    const updateOperation = isAdd
        ? { $addToSet: { tags: tag } }
        : { $pull: { tags: tag } };

    const course = await Course.findByIdAndUpdate(
        courseId,
        updateOperation,
        { new: true }
    );

    return course;
};

/**
 * Update course status (with workflow validation)
 */
const updateCourseStatus = async (courseId, targetStatus, user) => {
    const allowedStatuses = ['draft', 'pending', 'published', 'rejected', 'hidden'];
    if (!allowedStatuses.includes(targetStatus)) {
        throw new Error('Invalid status');
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    const isAdmin = user.role === 'admin';
    const isInstructor = user.role === 'instructor';
    const isOwner = course.instructor_id && course.instructor_id.toString() === user._id.toString();

    if (!isAdmin && !(isInstructor && isOwner)) {
        throw new Error('Permission denied');
    }

    const currentStatus = course.status;

    if (currentStatus === targetStatus) {
        return { course, message: 'Course status unchanged' };
    }

    let allowed = false;
    let message = 'Course status updated';

    switch (currentStatus) {
        case 'draft':
            if (targetStatus === 'pending') {
                allowed = true;
                message = 'Course submitted for review';
            }
            break;
        case 'pending':
            if (isAdmin && targetStatus === 'published') {
                allowed = true;
                message = 'Course approved and published';
            } else if (isAdmin && targetStatus === 'rejected') {
                allowed = true;
                message = 'Course rejected';
            }
            break;
        case 'published':
            if (targetStatus === 'draft' && (isAdmin || isOwner)) {
                allowed = true;
                message = 'Course moved back to draft';
            }
            break;
        case 'rejected':
            if (targetStatus === 'pending' && (isAdmin || isOwner)) {
                allowed = true;
                message = 'Course resubmitted for review';
            }
            break;
    }

    if (!allowed) {
        throw new Error(`Invalid status transition from '${currentStatus}' to '${targetStatus}'`);
    }

    course.status = targetStatus;
    await course.save();

    return { course, message };
};

module.exports = {
    getCourses,
    getCourseById,
    getCategories,
    getTrendingTags,
    searchCourses,
    getSuggestedCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePublish,
    assignInstructor,
    manageTags,
    updateCourseStatus,
};

