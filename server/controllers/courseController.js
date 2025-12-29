const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');

// ============================================================
// PUBLIC OPERATIONS (READ ONLY)
// ============================================================

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
            order = 'desc',
            status
        } = req.query;

        const query = {};

        // Nếu client truyền status cụ thể (ví dụ: 'published' hoặc 'draft')
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by category
        if (category) query.category = category;

        // Filter by tag
        if (tag) query.tags = { $in: [tag] };

        // Filter by level
        if (level) query.level = level;

        // Full-text search
        if (search) query.$text = { $search: search };

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;
        sortOptions['_id'] = 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let coursesQuery = Course.find(query)
            .populate('instructor_id', 'name email')
            .skip(skip)
            .limit(parseInt(limit));

        if (search) {
            coursesQuery = coursesQuery.sort({
                score: { $meta: 'textScore' },
                _id: 1 // Tie-breaker cho search
            });
        } else {
            coursesQuery = coursesQuery.sort(sortOptions);
        }

        const courses = await coursesQuery.lean();

        // Get counts
        const coursesWithCounts = await Promise.all(
            courses.map(async (course) => {
                const enrollmentsCount = await Enrollment.countDocuments({ course_id: course._id });
                const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
                return { ...course, enrollmentsCount, lessonsCount };
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
        res.status(500).json({ success: false, message: 'Error fetching courses', error: error.message });
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
            // Cho phép Admin/Instructor xem course của chính mình dù chưa publish (Draft)
            const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'instructor' || req.user._id.toString() === course?.instructor_id?._id.toString());

            if (!course || (!isOwnerOrAdmin && course.status !== 'published')) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
        }

        // Count only active enrollments (enrolled or completed, not dropped/suspended)
        const enrollmentsCount = await Enrollment.countDocuments({ 
            course_id: id,
            status: { $in: ['enrolled', 'completed'] }
        });
        const lessonsCount = await Lesson.countDocuments({ course_id: id });

        const isEnrolled = req.user ? await Enrollment.findOne({
            student_id: req.user.id,
            course_id: id,
            status: { $in: ['enrolled', 'completed'] }
        }) : null;

        const lessons = await Lesson.find({ course_id: id })
            .sort('order')
            .select('title content_type description duration is_free order')
            .lean();

        res.json({
            success: true,
            data: {
                course: { ...course, enrollmentsCount, lessonsCount, lessons },
                isEnrolled: !!isEnrolled
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching course', error: error.message });
    }
};

// Get categories (public)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Course.distinct('category', { status: 'published' });
        res.json({ success: true, data: categories.filter(cat => cat && cat.trim() !== '') });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
    }
};

// Get trending tags (public)
exports.getTrendingTags = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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

        res.json({ success: true, data: trendingTags });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching trending tags', error: error.message });
    }
};

// Search courses (public)
exports.searchCourses = async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }

        const query = { status: 'published', $text: { $search: q } };
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
                const enrollmentsCount = await Enrollment.countDocuments({ course_id: course._id });
                const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
                return { ...course, enrollmentsCount, lessonsCount };
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
        res.status(500).json({ success: false, message: 'Error searching courses', error: error.message });
    }
};

// Get suggested courses based on similar tags/categories (public)
exports.getSuggestedCourses = async (req, res) => {
    try {
        const { courseId } = req.params;
        const limit = parseInt(req.query.limit) || 6;

        // Validate courseId
        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Course ID is required' });
        }

        // Get the current course
        const currentCourse = await Course.findById(courseId).lean();
        if (!currentCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Build query to find similar courses
        const query = {
            _id: { $ne: courseId }, // Exclude current course
            status: 'published'
        };

        // Build conditions for matching tags or category
        const matchConditions = [];

        // Match by tags if available
        if (currentCourse.tags && currentCourse.tags.length > 0) {
            matchConditions.push({ tags: { $in: currentCourse.tags } });
        }

        // Match by category if available
        if (currentCourse.category && currentCourse.category.trim() !== '') {
            matchConditions.push({ category: currentCourse.category });
        }

        // Use $or if we have match conditions, otherwise just exclude the current course
        if (matchConditions.length > 0) {
            query.$or = matchConditions;
        }

        // Find similar courses
        const suggestedCourses = await Course.find(query)
            .populate('instructor_id', 'name email')
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(limit)
            .lean();

        // Get counts for each course
        const coursesWithCounts = await Promise.all(
            suggestedCourses.map(async (course) => {
                const enrollmentsCount = await Enrollment.countDocuments({ course_id: course._id });
                const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
                return { ...course, enrollmentsCount, lessonsCount };
            })
        );

        res.json({
            success: true,
            data: { courses: coursesWithCounts }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching suggested courses', error: error.message });
    }
};

// ============================================================
// ADMIN / INSTRUCTOR CRUD OPERATIONS
// ============================================================

// CREATE COURSE
exports.createCourse = async (req, res) => {
    try {
        // Nếu là Instructor tạo, tự động gán instructor_id là chính họ
        // và ép trạng thái về "draft" theo flow: Instructor tạo course → draft
        if (req.user.role === 'instructor') {
            req.body.instructor_id = req.user._id;
            req.body.status = 'draft';
        } else if (req.user.role === 'admin') {
            // Admin tạo course: nếu không truyền status thì cũng để draft
            if (!req.body.status) {
                req.body.status = 'draft';
            }
        }

        const newCourse = await Course.create(req.body);

        res.status(201).json({
            success: true,
            data: newCourse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE COURSE
exports.updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'No course found with that ID' });
        }

        // Only admin or the owning instructor can edit
        const isOwner = course.instructor_id?.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ success: false, message: 'You do not have permission to edit this course' });
        }

        // Không cho phép chỉnh sửa status trực tiếp qua updateCourse,
        // mọi thay đổi trạng thái phải đi qua updateCourseStatus để đảm bảo đúng flow moderation.
        if (req.body.status) {
            delete req.body.status;
        }

        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE COURSE
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'No course found with that ID' });
        }

        // Only admin or the owning instructor can delete
        const isOwner = course.instructor_id?.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ success: false, message: 'You do not have permission to delete this course' });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: null,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUBLISH / UNPUBLISH (Toggle Status)
exports.togglePublish = async (req, res) => {
    try {
        const isPublish = req.path.includes('publish') && !req.path.includes('unpublish');
        const newStatus = isPublish ? 'published' : 'draft';

        // Tìm course để check quyền trước
        const courseCheck = await Course.findById(req.params.id);
        if (!courseCheck) return res.status(404).json({ success: false, message: 'No course found' });

        const isOwner = courseCheck.instructor_id?.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const course = await Course.findByIdAndUpdate(req.params.id,
            { status: newStatus },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: isPublish ? 'Course published' : 'Course unpublished',
            data: course
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ASSIGN INSTRUCTOR (Admin only)
exports.assignInstructor = async (req, res) => {
    try {
        const { instructorId } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const course = await Course.findByIdAndUpdate(req.params.id,
            { instructor_id: instructorId },
            { new: true }
        );

        if (!course) return res.status(404).json({ success: false, message: 'No course found' });

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// MANAGE TAGS (Add/Remove)
exports.manageTags = async (req, res) => {
    try {
        const { tag } = req.body;
        const isAdd = req.path.includes('add');

        const courseCheck = await Course.findById(req.params.id);
        if (!courseCheck) return res.status(404).json({ success: false, message: 'No course found' });

        const isOwner = courseCheck.instructor_id?.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const updateOperation = isAdd
            ? { $addToSet: { tags: tag } }
            : { $pull: { tags: tag } };

        const course = await Course.findByIdAndUpdate(req.params.id,
            updateOperation,
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update course status
exports.updateCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status: targetStatus } = req.body;
        const allowedStatuses = ['draft', 'pending', 'published', 'rejected', 'hidden'];
        if (!allowedStatuses.includes(targetStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isInstructor = req.user.role === 'instructor';
        const isOwner = course.instructor_id && course.instructor_id.toString() === req.user._id.toString();

        // Only admin or owning instructor can update status
        if (!isAdmin && !(isInstructor && isOwner)) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const currentStatus = course.status;

        // Nếu không đổi gì thì trả về luôn
        if (currentStatus === targetStatus) {
            return res.json({ success: true, message: 'Course status unchanged', data: course });
        }

        let allowed = false;
        let message = 'Course status updated';

        switch (currentStatus) {
            case 'draft':
                // Chỉ cho phép submit for review: draft → pending
                // Muốn publish lại phải qua pending và được admin duyệt (pending → published)
                if (targetStatus === 'pending') {
                    allowed = true;
                    message = 'Course submitted for review';
                }
                break;
            case 'pending':
                // Chỉ admin được duyệt hoặc reject: pending → published / rejected
                if (isAdmin && targetStatus === 'published') {
                    allowed = true;
                    message = 'Course approved and published';
                } else if (isAdmin && targetStatus === 'rejected') {
                    allowed = true;
                    message = 'Course rejected';
                }
                break;
            case 'published':
                // Instructor hoặc admin có thể đưa về draft: published → draft
                if (targetStatus === 'draft' && (isAdmin || isOwner)) {
                    allowed = true;
                    message = 'Course moved back to draft';
                }
                break;
            case 'rejected':
                // Instructor hoặc admin resubmit: rejected → pending
                if (targetStatus === 'pending' && (isAdmin || isOwner)) {
                    allowed = true;
                    message = 'Course resubmitted for review';
                }
                break;
            default:
                // Các trạng thái khác (hidden, v.v.) hiện chưa dùng trong flow chính
                break;
        }

        if (!allowed) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${currentStatus}' to '${targetStatus}'`
            });
        }

        course.status = targetStatus;
        await course.save();
        res.json({ success: true, message, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};