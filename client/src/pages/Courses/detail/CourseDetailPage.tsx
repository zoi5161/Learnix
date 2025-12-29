import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, CourseWithCounts } from '../../../services/courseService';
import { enrollmentService } from '../../../services/enrollmentService';
import { quizService } from '../../../services/quizService';
import { getUserFromToken } from '../../../utils/authToken';
import PublicNavbar from '../../../components/PublicNavbar';
import SuggestedCourses from '../../../components/SuggestedCourses/SuggestedCourses';
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

interface QuizItem {
    id: string;
    _id: string;
    title: string;
    questionsCount: number;
    time_limit: number;
}

const CourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = getUserFromToken();

    const [course, setCourse] = useState<CourseWithCounts | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [courseRes, quizRes] = await Promise.all([
                    courseService.getCourseById(id),
                    quizService.getQuizzes({ course_id: id })
                ]);

                if (courseRes.success) {
                    setCourse(courseRes.data.course);
                    setIsEnrolled(courseRes.data.isEnrolled);
                    setLessons(courseRes.data.course.lessons || []);
                } else {
                    setError('Course not found');
                }

                if (quizRes.success) {
                    setQuizzes(quizRes.data.quizzes || []);
                }

            } catch (err: any) {
                setError(err.message || 'Failed to load course data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleLessonClick = (lesson: Lesson) => {
        const isLocked = !isEnrolled && !lesson.is_free;
        if (isLocked) {
            setShowLoginModal(true);
            return;
        }
        navigate(`/courses/${id}/lessons/${lesson._id}`);
    };

    const handleQuizClick = (quizId: string) => {
        if (!isEnrolled) {
            setShowLoginModal(true);
            return;
        }
        navigate(`/courses/${id}/quizzes/${quizId}/take`);
    };

    const handleEnrollClick = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        if (!id) return;

        try {
            setEnrolling(true);
            const res = await enrollmentService.enrollCourse(id);
            if (res.success) {
                setIsEnrolled(true);
                alert(`Successfully enrolled! Remaining budget: $${res.data.remainingBudget.toFixed(2)}`);
                // Refresh data
                const courseRes = await courseService.getCourseById(id);
                if (courseRes.success) {
                    setCourse(courseRes.data.course);
                    setIsEnrolled(courseRes.data.isEnrolled);
                }
            } else {
                alert('Failed to enroll: ' + res.message);
            }
        } catch (err: any) {
             if (err.response?.data?.message === 'Insufficient budget') {
                alert(`Insufficient budget.`);
            } else {
                alert('Error: ' + (err.message || 'Failed to enroll'));
            }
        } finally {
            setEnrolling(false);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return '#10b981';
            case 'intermediate': return '#f59e0b';
            case 'advanced': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const isOwnerOrAdmin = (() => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role !== 'instructor') return false;

        const instructorId = typeof course?.instructor_id === 'object' && course?.instructor_id !== null
            ? (course.instructor_id as any)._id || (course.instructor_id as any).id
            : course?.instructor_id;
        const currentUserId = (user as any)._id || (user as any).id;
        return instructorId?.toString() === currentUserId?.toString();
    })();

    if (loading) return (
        <div className="course-detail-page">
            <PublicNavbar />
            <div className="course-detail-loading">
                <div className="course-detail-spinner"></div>
                <p>Loading course...</p>
            </div>
        </div>
    );

    if (error || !course) return (
        <div className="course-detail-page">
            <PublicNavbar />
            <div className="course-detail-error">
                <p>{error || 'Course not found'}</p>
                <Link to="/courses" className="course-detail-back-link">Back to Courses</Link>
            </div>
        </div>
    );

    const instructorName = typeof course.instructor_id === 'object' && course.instructor_id !== null
        ? course.instructor_id.name || 'Unknown' : 'Unknown';

    return (
        <div className="course-detail-page">
            <PublicNavbar />
            <main className="course-detail-main">
                <div className="course-detail-container">
                    
                    {/* Header */}
                    <div className="course-detail-header">
                        <div className="course-detail-back">
                            <button onClick={() => navigate('/courses')} className="course-detail-back-btn">← Back to course</button>
                        </div>
                        <div className="course-detail-header-content">
                            <div className="course-detail-badges">
                                <span className="course-detail-level" style={{ backgroundColor: getLevelColor(course.level) }}>
                                    {course.level}
                                </span>
                                {course.is_premium && <span className="course-detail-premium">Premium</span>}
                            </div>
                            <h1 className="course-detail-title">{course.title}</h1>
                            <p className="course-detail-instructor">By {instructorName}</p>
                            
                            {/* 🔥 UPDATE: Instructor Toolbar đẹp hơn */}
                            {isOwnerOrAdmin && (
                                <div className="instructor-toolbar">
                                    <span className="instructor-label">Instructor Tools:</span>
                                    <button onClick={() => navigate(`/quizzes`)} className="btn-manage">
                                        <span className="btn-manage-icon">📝</span> Manage Quizzes
                                    </button>
                                    {/* Bạn có thể thêm nút Manage Lessons ở đây sau này */}
                                </div>
                            )}

                            <div className="course-detail-stats">
                                <div className="course-detail-stat-item course-detail-stat-highlight">
                                    <span className="course-detail-stat-icon">👥</span>
                                    <span className="course-detail-stat-value">{course.enrollmentsCount || 0}</span>
                                    <span className="course-detail-stat-label">students enrolled</span>
                                </div>
                                <span className="course-detail-stat-divider">•</span>
                                <div className="course-detail-stat-item">
                                    <span className="course-detail-stat-icon">📚</span>
                                    <span className="course-detail-stat-value">{course.lessonsCount || 0}</span>
                                    <span className="course-detail-stat-label">lessons</span>
                                </div>
                                {course.price !== undefined && course.price > 0 && (
                                    <>
                                        <span className="course-detail-stat-divider">•</span>
                                        <div className="course-detail-stat-item">
                                            <span className="course-detail-stat-value course-detail-price">${course.price.toFixed(2)}</span>
                                        </div>
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

                    {/* Content */}
                    <div className="course-detail-content">
                        <div className="course-detail-main-content">
                            <section className="course-detail-section">
                                <h2 className="course-detail-section-title">About This Course</h2>
                                <div className="course-detail-description">
                                    {course.description.split('\n').map((para, idx) => <p key={idx}>{para}</p>)}
                                </div>
                            </section>

                            {course.tags && course.tags.length > 0 && (
                                <section className="course-detail-section">
                                    <h2 className="course-detail-section-title">Tags</h2>
                                    <div className="course-detail-tags">
                                        {course.tags.map((tag) => (
                                            <Link key={tag} to={`/courses?tag=${encodeURIComponent(tag)}`} className="course-detail-tag">{tag}</Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Instructor Information Section */}
                            {course.instructor_id && typeof course.instructor_id === 'object' && (
                                <section className="course-detail-section">
                                    <h2 className="course-detail-section-title">Instructor Information</h2>
                                    <div className="course-detail-instructor-info">
                                        <div className="course-detail-instructor-card">
                                            <div className="course-detail-instructor-avatar">
                                                {course.instructor_id.name 
                                                    ? course.instructor_id.name.charAt(0).toUpperCase() 
                                                    : 'I'}
                                            </div>
                                            <div className="course-detail-instructor-details">
                                                <h3 className="course-detail-instructor-name">
                                                    {course.instructor_id.name || 'Unknown Instructor'}
                                                </h3>
                                                {course.instructor_id.email && (
                                                    <p className="course-detail-instructor-email">
                                                        {course.instructor_id.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section className="course-detail-section">
                                <h2 className="course-detail-section-title">Course Content</h2>
                                
                                {lessons.length === 0 && quizzes.length === 0 ? (
                                    <p className="course-detail-empty">No content available yet.</p>
                                ) : (
                                    <div className="course-detail-lessons">
                                        
                                        {/* Render Lessons */}
                                        {lessons.map((lesson, index) => {
                                            const isLocked = !isEnrolled && !lesson.is_free;
                                            return (
                                                <div
                                                    key={lesson._id}
                                                    className={`course-detail-lesson-item ${isLocked ? 'course-detail-lesson-locked' : ''}`}
                                                    onClick={() => !isLocked && handleLessonClick(lesson)}
                                                >
                                                    <div className={`course-detail-lesson-number ${isLocked ? 'course-detail-lesson-number-locked' : ''}`}>
                                                        {isLocked ? '🔒' : index + 1}
                                                    </div>
                                                    <div className="course-detail-lesson-content">
                                                        <div className="course-detail-lesson-header">
                                                            <h3 className={`course-detail-lesson-title ${isLocked ? 'course-detail-lesson-title-locked' : ''}`}>
                                                                {lesson.title}
                                                            </h3>
                                                            {isLocked && <span className="course-detail-lesson-lock-badge">Locked</span>}
                                                        </div>
                                                        <div className="course-detail-lesson-meta">
                                                            <span className="course-detail-lesson-type">{lesson.content_type}</span>
                                                            {lesson.duration && <><span>•</span><span>{lesson.duration} min</span></>}
                                                            {lesson.is_free && <><span>•</span><span className="course-detail-lesson-free">Free</span></>}
                                                            {isLocked && <span className="course-detail-lesson-locked-text">Locked</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* 🔥 UPDATE: Render Quizzes với nút Start */}
                                        {quizzes.map((quiz) => {
                                            const isLocked = !isEnrolled;
                                            const quizId = quiz._id || quiz.id;
                                            return (
                                                <div
                                                    key={quizId}
                                                    className={`course-detail-lesson-item ${isLocked ? 'course-detail-lesson-locked' : 'quiz-item-row'}`}
                                                    onClick={() => !isLocked && handleQuizClick(quizId)}
                                                >
                                                    <div className={`course-detail-lesson-number ${isLocked ? 'course-detail-lesson-number-locked' : 'quiz-icon'}`}>
                                                        {isLocked ? '🔒' : 'Q'}
                                                    </div>
                                                    <div className="course-detail-lesson-content">
                                                        <div className="course-detail-lesson-header">
                                                            <h3 className={`course-detail-lesson-title ${isLocked ? 'course-detail-lesson-title-locked' : ''}`} style={{ color: isLocked ? undefined : '#be185d' }}>
                                                                {quiz.title}
                                                            </h3>
                                                            {!isLocked && <span className="quiz-badge">Quiz</span>}
                                                            {isLocked && <span className="course-detail-lesson-lock-badge">Locked</span>}
                                                        </div>
                                                        
                                                        <div className="course-detail-lesson-meta" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                            <span>❓ {quiz.questionsCount} Questions</span>
                                                            {quiz.time_limit > 0 && <><span>•</span><span>⏱ {quiz.time_limit} mins</span></>}
                                                            
                                                            {/* 🔥 UPDATE: Nút Start Quiz cho Student */}
                                                            {!isLocked && (
                                                                <button 
                                                                    className="btn-start-quiz"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Tránh kích hoạt onclick của parent
                                                                        handleQuizClick(quizId);
                                                                    }}
                                                                >
                                                                    Start Quiz →
                                                                </button>
                                                            )}
                                                            
                                                            {isLocked && <span className="course-detail-lesson-locked-text" style={{ marginLeft: 10 }}>Enroll to unlock</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    </div>
                                )}
                            </section>

                            {/* Suggested Courses */}
                            {id && <SuggestedCourses courseId={id} currentCourseTitle={course.title} />}
                        </div>

                        {/* Sidebar */}
                        <aside className="course-detail-sidebar">
                            <div className="course-detail-sidebar-card">
                                {course.price !== undefined && course.price > 0 && (
                                    <div className="course-detail-sidebar-price">${course.price.toFixed(2)}</div>
                                )}
                                {!isEnrolled ? (
                                    <button onClick={handleEnrollClick} disabled={enrolling} className="course-detail-enroll-button">
                                        {enrolling ? 'Enrolling...' : (user ? 'Enroll Now' : 'Sign Up to Enroll')}
                                    </button>
                                ) : (
                                    <Link to={`/courses/${id}/learn`} className="course-detail-enroll-button course-detail-enroll-button-enrolled">
                                        Continue Learning
                                    </Link>
                                )}
                                <div className="course-detail-sidebar-info">
                                    <div className="course-detail-sidebar-info-item"><strong>Instructor:</strong> {instructorName}</div>
                                    <div className="course-detail-sidebar-info-item"><strong>Level:</strong> {course.level}</div>
                                    <div className="course-detail-sidebar-info-item"><strong>Lessons:</strong> {course.lessonsCount || 0}</div>
                                    <div className="course-detail-sidebar-info-item"><strong>Quizzes:</strong> {quizzes.length}</div>
                                    <div className="course-detail-sidebar-info-item"><strong>Students:</strong> {course.enrollmentsCount || 0}</div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {showLoginModal && (
                <div className="course-detail-modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="course-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="course-detail-modal-title">Sign Up Required</h3>
                        <p className="course-detail-modal-message">Please sign up or log in to access this content.</p>
                        <div className="course-detail-modal-actions">
                            <Link to="/login" className="course-detail-modal-button course-detail-modal-button-primary">Login</Link>
                            <Link to="/register" className="course-detail-modal-button course-detail-modal-button-secondary">Sign Up</Link>
                            <button onClick={() => setShowLoginModal(false)} className="course-detail-modal-button course-detail-modal-button-cancel">Cancel</button>
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