import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonService, Lesson } from '../../../services/lessonService';
import { courseService } from '../../../services/courseService';
import BaseLayout from '../../../layouts/BaseLayout';
import './CourseLearnPage.css';

const CourseLearnPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<any>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId) return;

            try {
                setLoading(true);
                const [courseRes, lessonsRes] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getCourseLessons(courseId)
                ]);

                if (courseRes.success) {
                    setCourse(courseRes.data.course);
                }
                if (lessonsRes.success) {
                    setLessons(lessonsRes.data.lessons);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load course');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    const getProgressColor = (status?: string) => {
        switch (status) {
            case 'completed':
                return '#10b981';
            case 'in_progress':
                return '#667eea';
            default:
                return '#9ca3af';
        }
    };

    if (loading) {
        return (
            <BaseLayout>
                <div className="course-learn-page">
                    <div className="course-learn-loading">
                        <div className="course-learn-spinner"></div>
                        <p>Loading course...</p>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    if (error || !course) {
        return (
            <BaseLayout>
                <div className="course-learn-page">
                    <div className="course-learn-error">
                        <p>{error || 'Course not found'}</p>
                        <Link to="/dashboard" className="course-learn-back-link">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    const completedCount = lessons.filter(l => l.progress?.status === 'completed').length;
    const overallProgress = lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    return (
        <BaseLayout>
            <div className="course-learn-page">
                {/* Header */}
                <div className="course-learn-header">
                    <div className="course-learn-breadcrumb">
                        <Link to="/dashboard">Dashboard</Link>
                        <span> / </span>
                        <Link to={`/courses/${courseId}`}>{course.title}</Link>
                        <span> / </span>
                        <span>Learn</span>
                    </div>
                </div>

                <div className="course-learn-main">
                    <div className="course-learn-content">
                        <h1 className="course-learn-title">{course.title}</h1>
                        
                        {/* Overall Progress */}
                        <div className="course-learn-overall-progress">
                            <div className="course-learn-overall-progress-header">
                                <h2 className="course-learn-overall-progress-title">Course Progress</h2>
                                <span className="course-learn-overall-progress-percentage">{overallProgress}%</span>
                            </div>
                            <div className="course-learn-overall-progress-bar">
                                <div
                                    className="course-learn-overall-progress-fill"
                                    style={{ width: `${overallProgress}%` }}
                                ></div>
                            </div>
                            <p className="course-learn-overall-progress-text">
                                {completedCount} of {lessons.length} lessons completed
                            </p>
                        </div>

                        {/* Lessons List */}
                        <div className="course-learn-lessons">
                            <h2 className="course-learn-lessons-title">Lessons</h2>
                            {lessons.length > 0 ? (
                                <div className="course-learn-lessons-list">
                                    {lessons.map((lesson, index) => (
                                        <div
                                            key={lesson._id}
                                            className="course-learn-lesson-item"
                                            onClick={() => navigate(`/courses/${courseId}/lessons/${lesson._id}`)}
                                        >
                                            <div className="course-learn-lesson-number">
                                                {index + 1}
                                            </div>
                                            <div className="course-learn-lesson-content">
                                                <div className="course-learn-lesson-header">
                                                    <h3 className="course-learn-lesson-title">{lesson.title}</h3>
                                                    <span
                                                        className="course-learn-lesson-status"
                                                        style={{ backgroundColor: getProgressColor(lesson.progress?.status) }}
                                                    >
                                                        {lesson.progress?.status === 'completed' ? '✓ Completed' :
                                                         lesson.progress?.status === 'in_progress' ? 'In Progress' :
                                                         'Not Started'}
                                                    </span>
                                                </div>
                                                {lesson.description && (
                                                    <p className="course-learn-lesson-description">{lesson.description}</p>
                                                )}
                                                <div className="course-learn-lesson-meta">
                                                    <span className="course-learn-lesson-type">{lesson.content_type}</span>
                                                    {lesson.duration && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{lesson.duration} min</span>
                                                        </>
                                                    )}
                                                    {lesson.is_free && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="course-learn-lesson-free">Free</span>
                                                        </>
                                                    )}
                                                </div>
                                                {lesson.progress && lesson.progress.completion_percentage > 0 && (
                                                    <div className="course-learn-lesson-progress">
                                                        <div className="course-learn-lesson-progress-bar">
                                                            <div
                                                                className="course-learn-lesson-progress-fill"
                                                                style={{ width: `${lesson.progress.completion_percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="course-learn-lesson-progress-text">
                                                            {lesson.progress.completion_percentage}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="course-learn-empty">No lessons available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};

export default CourseLearnPage;

