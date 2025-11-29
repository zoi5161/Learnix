import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import { studentService } from '../../services/studentService';
import { enrollmentService } from '../../services/enrollmentService';
import BaseLayout from '../../layouts/BaseLayout';
import './StudentDashboard.css';

interface EnrolledCourse {
    _id: string;
    title: string;
    description: string;
    level: string;
    thumbnail?: string;
    category?: string;
    tags?: string[];
    instructor: {
        _id: string;
        name: string;
        email: string;
    };
    progress: {
        completed: number;
        total: number;
        percentage: number;
    };
    status: 'in-progress' | 'completed';
    enrolledAt: string;
}

interface SuggestedCourse {
    _id: string;
    title: string;
    description: string;
    level: string;
    thumbnail?: string;
    price?: number;
    category?: string;
    tags?: string[];
    summary?: string;
    instructor_id: {
        _id: string;
        name: string;
        email: string;
    };
    enrollmentsCount: number;
    lessonsCount: number;
}

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentData, setStudentData] = useState<{
        student: {
            name: string;
            email: string;
            budget: number;
            bonus_credits: number;
            total_budget: number;
        };
        statistics: {
            totalEnrolled: number;
            totalCompleted: number;
            overallProgress: number;
        };
        enrolledCourses: EnrolledCourse[];
        suggestedCourses: SuggestedCourse[];
    } | null>(null);

    useEffect(() => {
        // Get fresh user data inside useEffect to avoid dependency issues
        const currentUser = getUserFromToken();
        
        // Check user role first
        if (!currentUser || currentUser.role !== 'student') {
            navigate('/login');
            return;
        }

        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await studentService.getDashboard();
                console.log('Dashboard API Response:', res);
                if (res.success) {
                    console.log('Dashboard Data:', res.data);
                    setStudentData(res.data);
                } else {
                    setError('Failed to load dashboard');
                }
            } catch (err: any) {
                console.error('Dashboard Error:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const handleUnenroll = async (courseId: string, courseTitle: string) => {
        if (!window.confirm(`Are you sure you want to unenroll from "${courseTitle}"?`)) {
            return;
        }

        try {
            const res = await enrollmentService.unenrollCourse(courseId);
            if (res.success) {
                // Refresh dashboard
                const dashboardRes = await studentService.getDashboard();
                if (dashboardRes.success) {
                    setStudentData(dashboardRes.data);
                }
            } else {
                alert('Failed to unenroll: ' + res.message);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'in-progress':
                return '#667eea';
            default:
                return '#6b7280';
        }
    };

    if (loading) {
        return (
            <BaseLayout>
                <div className="student-dashboard">
                    <div className="student-dashboard-loading">
                        <div className="student-dashboard-spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    if (error || !studentData) {
        return (
            <BaseLayout>
                <div className="student-dashboard">
                    <div className="student-dashboard-error">
                        <p>Error: {error || 'Failed to load dashboard'}</p>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    return (
        <BaseLayout>
            <div className="student-dashboard">
                {/* Header */}
                <div className="student-dashboard-header">
                    <h1 className="student-dashboard-title">
                        Welcome, {studentData.student.name}!
                    </h1>
                    <div className="student-dashboard-budget">
                        <div className="student-dashboard-budget-item">
                            <span className="student-dashboard-budget-label">Budget:</span>
                            <span className="student-dashboard-budget-value">
                                ${studentData.student.budget.toFixed(2)}
                            </span>
                        </div>
                        <div className="student-dashboard-budget-item">
                            <span className="student-dashboard-budget-label">Bonus Credits:</span>
                            <span className="student-dashboard-budget-value student-dashboard-budget-bonus">
                                ${studentData.student.bonus_credits.toFixed(2)}
                            </span>
                        </div>
                        <div className="student-dashboard-budget-item student-dashboard-budget-total">
                            <span className="student-dashboard-budget-label">Total:</span>
                            <span className="student-dashboard-budget-value">
                                ${studentData.student.total_budget.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="student-dashboard-stats">
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Courses Enrolled</h3>
                        <p className="student-dashboard-stat-value">{studentData.statistics.totalEnrolled}</p>
                    </div>
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Courses Completed</h3>
                        <p className="student-dashboard-stat-value">{studentData.statistics.totalCompleted}</p>
                    </div>
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Overall Progress</h3>
                        <p className="student-dashboard-stat-value">{studentData.statistics.overallProgress}%</p>
                    </div>
                </div>

                {/* Enrolled Courses */}
                <section className="student-dashboard-section">
                    <h2 className="student-dashboard-section-title">My Courses</h2>
                    {studentData.enrolledCourses.length > 0 ? (
                        <div className="student-dashboard-courses-grid">
                            {studentData.enrolledCourses.map((course) => (
                                <div key={course._id} className="student-dashboard-course-card">
                                    {course.thumbnail && (
                                        <div className="student-dashboard-course-thumbnail">
                                            <img src={course.thumbnail} alt={course.title} />
                                        </div>
                                    )}
                                    <div className="student-dashboard-course-content">
                                        <div className="student-dashboard-course-header">
                                            <span
                                                className="student-dashboard-course-level"
                                                style={{ backgroundColor: getLevelColor(course.level) }}
                                            >
                                                {course.level}
                                            </span>
                                            <span
                                                className="student-dashboard-course-status"
                                                style={{ backgroundColor: getStatusColor(course.status) }}
                                            >
                                                {course.status === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                        </div>
                                        <h3 className="student-dashboard-course-title">
                                            <Link to={`/courses/${course._id}`}>{course.title}</Link>
                                        </h3>
                                        <p className="student-dashboard-course-instructor">
                                            By {course.instructor && typeof course.instructor === 'object' && course.instructor.name || 'Unknown Instructor'}
                                        </p>
                                        <div className="student-dashboard-course-progress">
                                            <div className="student-dashboard-course-progress-bar">
                                                <div
                                                    className="student-dashboard-course-progress-fill"
                                                    style={{ width: `${course.progress.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="student-dashboard-course-progress-text">
                                                {course.progress.completed} / {course.progress.total} lessons ({course.progress.percentage}%)
                                            </span>
                                        </div>
                                        <div className="student-dashboard-course-actions">
                                            <Link
                                                to={`/courses/${course._id}/learn`}
                                                className="student-dashboard-course-button student-dashboard-course-button-primary"
                                            >
                                                Continue Learning
                                            </Link>
                                            <button
                                                onClick={() => handleUnenroll(course._id, course.title)}
                                                className="student-dashboard-course-button student-dashboard-course-button-secondary"
                                            >
                                                Unenroll
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="student-dashboard-empty">
                            <p>You haven't enrolled in any courses yet.</p>
                            <Link to="/courses" className="student-dashboard-empty-link">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </section>

                {/* Suggested Courses */}
                {studentData.suggestedCourses.length > 0 && (
                    <section className="student-dashboard-section">
                        <h2 className="student-dashboard-section-title">Suggested Courses</h2>
                        <div className="student-dashboard-courses-grid">
                            {studentData.suggestedCourses.map((course) => (
                                <div key={course._id} className="student-dashboard-course-card">
                                    {course.thumbnail && (
                                        <div className="student-dashboard-course-thumbnail">
                                            <img src={course.thumbnail} alt={course.title} />
                                        </div>
                                    )}
                                    <div className="student-dashboard-course-content">
                                        <div className="student-dashboard-course-header">
                                            <span
                                                className="student-dashboard-course-level"
                                                style={{ backgroundColor: getLevelColor(course.level) }}
                                            >
                                                {course.level}
                                            </span>
                                        </div>
                                        <h3 className="student-dashboard-course-title">
                                            <Link to={`/courses/${course._id}`}>{course.title}</Link>
                                        </h3>
                                        <p className="student-dashboard-course-instructor">
                                            By {course.instructor_id && typeof course.instructor_id === 'object' && course.instructor_id.name || 'Unknown Instructor'}
                                        </p>
                                        {course.summary && (
                                            <p className="student-dashboard-course-summary">{course.summary}</p>
                                        )}
                                        <div className="student-dashboard-course-stats">
                                            <span>{course.enrollmentsCount} students</span>
                                            <span>•</span>
                                            <span>{course.lessonsCount} lessons</span>
                                        </div>
                                        {course.price !== undefined && course.price > 0 && (
                                            <div className="student-dashboard-course-price">
                                                ${course.price.toFixed(2)}
                                            </div>
                                        )}
                                        <Link
                                            to={`/courses/${course._id}`}
                                            className="student-dashboard-course-button student-dashboard-course-button-primary"
                                        >
                                            View Course
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </BaseLayout>
    );
};

export default StudentDashboard;