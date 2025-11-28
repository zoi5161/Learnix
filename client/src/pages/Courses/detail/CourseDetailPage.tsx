import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, CourseWithCounts } from '../../../services/courseService';
import { getUserFromToken } from '../../../utils/authToken';
import PublicNavbar from '../../../components/PublicNavbar';
import './CourseDetailPage.css';

interface Lesson {
    _id: string;
    title: string;
    content_type: string;
    description?: string;
    duration?: number;
    is_free: boolean;
    order: number;
}

const CourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = getUserFromToken();

    const [course, setCourse] = useState<CourseWithCounts | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const res = await courseService.getCourseById(id);

                if (res.success) {
                    setCourse(res.data.course);
                    setIsEnrolled(res.data.isEnrolled);
                    // Always set lessons (even if empty array)
                    setLessons(res.data.course.lessons || []);
                } else {
                    setError('Course not found');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load course');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id]);

    const handleLessonClick = (lesson: Lesson) => {
        const isLocked = !isEnrolled && !lesson.is_free;
        if (isLocked) {
            setShowLoginModal(true);
            return;
        }
        // Navigate to lesson viewer (will be implemented in next phase)
        navigate(`/courses/${id}/lessons/${lesson._id}`);
    };

    const handleEnrollClick = () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        // Navigate to enrollment (will be implemented in next phase)
        navigate(`/courses/${id}/enroll`);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner':
                return '#10b981';
            case 'intermediate':
                return '#f59e0b';
            case 'advanced':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    if (loading) {
        return (
            <div className="course-detail-page">
                <PublicNavbar />
                <div className="course-detail-loading">
                    <div className="course-detail-spinner"></div>
                    <p>Loading course...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="course-detail-page">
                <PublicNavbar />
                <div className="course-detail-error">
                    <p>{error || 'Course not found'}</p>
                    <Link to="/courses" className="course-detail-back-link">
                        Back to Courses
                    </Link>
                </div>
            </div>
        );
    }

    const instructorName = course.instructor_id && typeof course.instructor_id === 'object' && course.instructor_id !== null
        ? course.instructor_id.name || 'Unknown'
        : 'Unknown';

    return (
        <div className="course-detail-page">
            <PublicNavbar />
            <main className="course-detail-main">
                <div className="course-detail-container">
                    {/* Course Header */}
                    <div className="course-detail-header">
                        <div className="course-detail-header-content">
                            <div className="course-detail-badges">
                                <span
                                    className="course-detail-level"
                                    style={{ backgroundColor: getLevelColor(course.level) }}
                                >
                                    {course.level}
                                </span>
                                {course.is_premium && (
                                    <span className="course-detail-premium">Premium</span>
                                )}
                            </div>
                            <h1 className="course-detail-title">{course.title}</h1>
                            <p className="course-detail-instructor">By {instructorName}</p>
                            <div className="course-detail-stats">
                                <span>{course.enrollmentsCount || 0} students</span>
                                <span>•</span>
                                <span>{course.lessonsCount || 0} lessons</span>
                                {course.price !== undefined && course.price > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="course-detail-price">${course.price.toFixed(2)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {course.thumbnail && (
                            <div className="course-detail-thumbnail">
                                <img src={course.thumbnail} alt={course.title} />
                            </div>
                        )}
                    </div>

                    {/* Course Content */}
                    <div className="course-detail-content">
                        <div className="course-detail-main-content">
                            {/* Description */}
                            <section className="course-detail-section">
                                <h2 className="course-detail-section-title">About This Course</h2>
                                <div className="course-detail-description">
                                    {course.description.split('\n').map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            </section>

                            {/* Tags */}
                            {course.tags && course.tags.length > 0 && (
                                <section className="course-detail-section">
                                    <h2 className="course-detail-section-title">Tags</h2>
                                    <div className="course-detail-tags">
                                        {course.tags.map((tag) => (
                                            <Link
                                                key={tag}
                                                to={`/courses?tag=${encodeURIComponent(tag)}`}
                                                className="course-detail-tag"
                                            >
                                                {tag}
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Lessons */}
                            <section className="course-detail-section">
                                <h2 className="course-detail-section-title">Course Content</h2>
                                {lessons.length > 0 ? (
                                    <div className="course-detail-lessons">
                                        {lessons.map((lesson, index) => {
                                            const isLocked = !isEnrolled && !lesson.is_free;
                                            return (
                                                <div
                                                    key={lesson._id}
                                                    className={`course-detail-lesson-item ${
                                                        isLocked ? 'course-detail-lesson-locked' : ''
                                                    }`}
                                                    onClick={() => !isLocked && handleLessonClick(lesson)}
                                                >
                                                    <div className={`course-detail-lesson-number ${
                                                        isLocked ? 'course-detail-lesson-number-locked' : ''
                                                    }`}>
                                                        {isLocked ? '🔒' : index + 1}
                                                    </div>
                                                    <div className="course-detail-lesson-content">
                                                        <div className="course-detail-lesson-header">
                                                            <h3 className={`course-detail-lesson-title ${
                                                                isLocked ? 'course-detail-lesson-title-locked' : ''
                                                            }`}>
                                                                {lesson.title}
                                                            </h3>
                                                            {isLocked && (
                                                                <span className="course-detail-lesson-lock-badge">
                                                                    Locked
                                                                </span>
                                                            )}
                                                        </div>
                                                        {lesson.description && (
                                                            <p className={`course-detail-lesson-description ${
                                                                isLocked ? 'course-detail-lesson-description-locked' : ''
                                                            }`}>
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                        <div className="course-detail-lesson-meta">
                                                            <span className="course-detail-lesson-type">
                                                                {lesson.content_type}
                                                            </span>
                                                            {lesson.duration && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{lesson.duration} min</span>
                                                                </>
                                                            )}
                                                            {lesson.is_free && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="course-detail-lesson-free">Free</span>
                                                                </>
                                                            )}
                                                            {isLocked && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="course-detail-lesson-locked-text">
                                                                        {user ? 'Enroll to unlock' : 'Sign up to unlock'}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="course-detail-empty">No lessons available yet.</p>
                                )}
                            </section>
                        </div>

                        {/* Sidebar */}
                        <aside className="course-detail-sidebar">
                            <div className="course-detail-sidebar-card">
                                {course.price !== undefined && course.price > 0 && (
                                    <div className="course-detail-sidebar-price">
                                        ${course.price.toFixed(2)}
                                    </div>
                                )}
                                {!isEnrolled ? (
                                    <button
                                        onClick={handleEnrollClick}
                                        className="course-detail-enroll-button"
                                    >
                                        {user ? 'Enroll Now' : 'Sign Up to Enroll'}
                                    </button>
                                ) : (
                                    <Link
                                        to={`/courses/${id}/learn`}
                                        className="course-detail-enroll-button course-detail-enroll-button-enrolled"
                                    >
                                        Continue Learning
                                    </Link>
                                )}
                                <div className="course-detail-sidebar-info">
                                    <div className="course-detail-sidebar-info-item">
                                        <strong>Instructor:</strong> {instructorName}
                                    </div>
                                    {course.category && (
                                        <div className="course-detail-sidebar-info-item">
                                            <strong>Category:</strong> {course.category}
                                        </div>
                                    )}
                                    <div className="course-detail-sidebar-info-item">
                                        <strong>Level:</strong> {course.level}
                                    </div>
                                    <div className="course-detail-sidebar-info-item">
                                        <strong>Lessons:</strong> {course.lessonsCount || 0}
                                    </div>
                                    <div className="course-detail-sidebar-info-item">
                                        <strong>Students:</strong> {course.enrollmentsCount || 0}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="course-detail-modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="course-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="course-detail-modal-title">Sign Up Required</h3>
                        <p className="course-detail-modal-message">
                            Please sign up or log in to access this content.
                        </p>
                        <div className="course-detail-modal-actions">
                            <Link
                                to="/login"
                                className="course-detail-modal-button course-detail-modal-button-primary"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="course-detail-modal-button course-detail-modal-button-secondary"
                            >
                                Sign Up
                            </Link>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="course-detail-modal-button course-detail-modal-button-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="course-detail-footer">
                <p>© 2025 Learnix | Intelligent E-Learning</p>
            </footer>
        </div>
    );
};

export default CourseDetailPage;

