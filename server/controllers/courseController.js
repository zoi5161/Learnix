const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// Get all published courses (public)
exports.getCourses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            tag,
            level,
            search,
            sort = 'createdAt',
            order = 'desc'
        } = req.query;

        const query = { status: 'published' };

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by tag
        if (tag) {
            query.tags = { $in: [tag] };
        }

        // Filter by level
        if (level) {
            query.level = level;
        }

        // Full-text search
        if (search) {
            query.$text = { $search: search };
        }

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let coursesQuery = Course.find(query)
            .populate('instructor_id', 'name email')
            .select('-description')
            .skip(skip)
            .limit(parseInt(limit));

        // Use text score for search, otherwise use sortOptions
        if (search) {
            coursesQuery = coursesQuery.sort({ score: { $meta: 'textScore' } });
        } else {
            coursesQuery = coursesQuery.sort(sortOptions);
        }

        const courses = await coursesQuery.lean();

        // Get enrollment counts and lessons counts
        const coursesWithCounts = await Promise.all(
            courses.map(async (course) => {
                const enrollmentsCount = await Enrollment.countDocuments({
                    course_id: course._id
                });
                const lessonsCount = await Lesson.countDocuments({
                    course_id: course._id
                });
                return {
                    ...course,
                    enrollmentsCount,
                    lessonsCount
                };
            })
        );

        const total = await Course.countDocuments(query);

        res.json({
            success: true,
            data: {
                courses: coursesWithCounts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// Get single course by ID (public)
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id)
            .populate('instructor_id', 'name email')
            .lean();

        if (!course || course.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get enrollment count
        const enrollmentsCount = await Enrollment.countDocuments({
            course_id: id
        });

        // Get lessons count
        const lessonsCount = await Lesson.countDocuments({
            course_id: id
        });

        // Check if user is enrolled
        const isEnrolled = req.user ? await Enrollment.findOne({
            student_id: req.user.id,
            course_id: id,
            status: { $in: ['enrolled', 'completed'] }
        }) : null;

        // Always get all lessons (for display, even if not enrolled)
        const lessons = await Lesson.find({ course_id: id })
            .sort('order')
            .select('title content_type description duration is_free order')
            .lean();

        res.json({
            success: true,
            data: {
                course: {
                    ...course,
                    enrollmentsCount,
                    lessonsCount,
                    lessons
                },
                isEnrolled: !!isEnrolled
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
};

// Get categories (public)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Course.distinct('category', {
            status: 'published'
        });
        res.json({
            success: true,
            data: categories.filter(cat => cat && cat.trim() !== '')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get trending tags (public)
exports.getTrendingTags = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const courses = await Course.find({ status: 'published' })
            .select('tags')
            .lean();

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

        res.json({
            success: true,
            data: trendingTags
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trending tags',
            error: error.message
        });
    }
};

// Search courses (public)
exports.searchCourses = async (req, res) => {
    try {
        const {
            q,
            page = 1,
            limit = 12
        } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const query = {
            status: 'published',
            $text: { $search: q }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const courses = await Course.find(query)
            .populate('instructor_id', 'name email')
            .select('-description')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const coursesWithCounts = await Promise.all(
            courses.map(async (course) => {
                const enrollmentsCount = await Enrollment.countDocuments({
                    course_id: course._id
                });
                const lessonsCount = await Lesson.countDocuments({
                    course_id: course._id
                });
                return {
                    ...course,
                    enrollmentsCount,
                    lessonsCount
                };
            })
        );

        const total = await Course.countDocuments(query);

        res.json({
            success: true,
            data: {
                courses: coursesWithCounts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching courses',
            error: error.message
        });
    }
};

