import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonService } from '../../../services/lessonService';
import BaseLayout from '../../../layouts/BaseLayout';
import './LessonViewer.css';

interface LessonData {
    lesson: {
        _id: string;
        title: string;
        content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
        content: string;
        description?: string;
        duration?: number;
        is_free: boolean;
        order: number;
        progress: {
            status: string;
            completion_percentage: number;
            time_spent: number;
            notes?: string;
        } | null;
    };
    course: {
        _id: string;
        title: string;
    };
    navigation: {
        prev: {
            _id: string;
            title: string;
        } | null;
        next: {
            _id: string;
            title: string;
        } | null;
        currentIndex: number;
        total: number;
    };
}

const LessonViewer: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lessonData, setLessonData] = useState<LessonData | null>(null);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!courseId || !lessonId) return;

            try {
                setLoading(true);
                const res = await lessonService.getLesson(courseId, lessonId);
                if (res.success) {
                    setLessonData(res.data);
                    setNotes(res.data.lesson.progress?.notes || '');
                    
                    // Auto-mark as in_progress if not started
                    if (res.data.lesson.progress?.status === 'not_started') {
                        await lessonService.updateProgress(courseId, lessonId, {
                            status: 'in_progress'
                        });
                    }
                } else {
                    setError('Failed to load lesson');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load lesson');
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [courseId, lessonId]);

    const handleComplete = async () => {
        if (!courseId || !lessonId) return;

        try {
            await lessonService.updateProgress(courseId, lessonId, {
                status: 'completed',
                completion_percentage: 100
            });
            
            // Refresh lesson data
            const res = await lessonService.getLesson(courseId, lessonId);
            if (res.success) {
                setLessonData(res.data);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleSaveNotes = async () => {
        if (!courseId || !lessonId) return;

        try {
            setSavingNotes(true);
            await lessonService.updateProgress(courseId, lessonId, { notes });
        } catch (err: any) {
            alert('Error saving notes: ' + err.message);
        } finally {
            setSavingNotes(false);
        }
    };

    const renderContent = () => {
        if (!lessonData) return null;

        const { lesson } = lessonData;

        switch (lesson.content_type) {
            case 'video':
                return (
                    <div className="lesson-viewer-video-container">
                        {lesson.content.startsWith('http') ? (
                            <iframe
                                src={lesson.content}
                                className="lesson-viewer-video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={lesson.title}
                            ></iframe>
                        ) : (
                            <video
                                src={lesson.content}
                                controls
                                className="lesson-viewer-video"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                );

            case 'text':
                return (
                    <div className="lesson-viewer-text-content">
                        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    </div>
                );

            case 'pdf':
                return (
                    <div className="lesson-viewer-pdf-container">
                        <iframe
                            src={lesson.content}
                            className="lesson-viewer-pdf"
                            title={lesson.title}
                        ></iframe>
                    </div>
                );

            case 'quiz':
            case 'assignment':
                return (
                    <div className="lesson-viewer-quiz-container">
                        <p className="lesson-viewer-quiz-message">
                            {lesson.content_type === 'quiz' ? 'Quiz' : 'Assignment'} content will be displayed here.
                        </p>
                        <p className="lesson-viewer-quiz-content">{lesson.content}</p>
                    </div>
                );

            default:
                return (
                    <div className="lesson-viewer-default">
                        <p>{lesson.content}</p>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <BaseLayout>
                <div className="lesson-viewer">
                    <div className="lesson-viewer-loading">
                        <div className="lesson-viewer-spinner"></div>
                        <p>Loading lesson...</p>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    if (error || !lessonData) {
        return (
            <BaseLayout>
                <div className="lesson-viewer">
                    <div className="lesson-viewer-error">
                        <p>{error || 'Lesson not found'}</p>
                        <Link to={`/courses/${courseId}`} className="lesson-viewer-back-link">
                            Back to Course
                        </Link>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    const { lesson, course, navigation } = lessonData;
    const isCompleted = lesson.progress?.status === 'completed';

    return (
        <BaseLayout>
            <div className="lesson-viewer">
                {/* Header */}
                <div className="lesson-viewer-header">
                    <div className="lesson-viewer-breadcrumb">
                        <Link to="/dashboard">Dashboard</Link>
                        <span> / </span>
                        <Link to={`/courses/${courseId}`}>{course.title}</Link>
                        <span> / </span>
                        <span>{lesson.title}</span>
                    </div>
                    <div className="lesson-viewer-progress-info">
                        Lesson {navigation.currentIndex} of {navigation.total}
                    </div>
                </div>

                {/* Lesson Content */}
                <div className="lesson-viewer-main">
                    <div className="lesson-viewer-content">
                        <h1 className="lesson-viewer-title">{lesson.title}</h1>
                        
                        {lesson.description && (
                            <p className="lesson-viewer-description">{lesson.description}</p>
                        )}

                        <div className="lesson-viewer-meta">
                            <span className="lesson-viewer-type">{lesson.content_type}</span>
                            {lesson.duration && (
                                <>
                                    <span>•</span>
                                    <span>{lesson.duration} min</span>
                                </>
                            )}
                            {lesson.is_free && (
                                <>
                                    <span>•</span>
                                    <span className="lesson-viewer-free">Free</span>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="lesson-viewer-content-area">
                            {renderContent()}
                        </div>

                        {/* Progress */}
                        {lesson.progress && (
                            <div className="lesson-viewer-progress-section">
                                <div className="lesson-viewer-progress-bar">
                                    <div
                                        className="lesson-viewer-progress-fill"
                                        style={{ width: `${lesson.progress.completion_percentage}%` }}
                                    ></div>
                                </div>
                                <span className="lesson-viewer-progress-text">
                                    {lesson.progress.completion_percentage}% Complete
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="lesson-viewer-actions">
                            {!isCompleted && (
                                <button
                                    onClick={handleComplete}
                                    className="lesson-viewer-button lesson-viewer-button-complete"
                                >
                                    Mark as Complete
                                </button>
                            )}
                            {isCompleted && (
                                <span className="lesson-viewer-completed-badge">✓ Completed</span>
                            )}
                        </div>

                        {/* Notes Section */}
                        <div className="lesson-viewer-notes">
                            <h3 className="lesson-viewer-notes-title">My Notes</h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your notes here..."
                                className="lesson-viewer-notes-textarea"
                                rows={6}
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                className="lesson-viewer-button lesson-viewer-button-save"
                            >
                                {savingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar - Navigation */}
                    <aside className="lesson-viewer-sidebar">
                        <div className="lesson-viewer-sidebar-card">
                            <h3 className="lesson-viewer-sidebar-title">Navigation</h3>
                            <div className="lesson-viewer-sidebar-navigation">
                                {navigation.prev ? (
                                    <Link
                                        to={`/courses/${courseId}/lessons/${navigation.prev._id}`}
                                        className="lesson-viewer-nav-link lesson-viewer-nav-prev"
                                    >
                                        ← Previous: {navigation.prev.title}
                                    </Link>
                                ) : (
                                    <span className="lesson-viewer-nav-link lesson-viewer-nav-disabled">
                                        ← No previous lesson
                                    </span>
                                )}
                                {navigation.next ? (
                                    <Link
                                        to={`/courses/${courseId}/lessons/${navigation.next._id}`}
                                        className="lesson-viewer-nav-link lesson-viewer-nav-next"
                                    >
                                        Next: {navigation.next.title} →
                                    </Link>
                                ) : (
                                    <span className="lesson-viewer-nav-link lesson-viewer-nav-disabled">
                                        No next lesson →
                                    </span>
                                )}
                            </div>
                            <Link
                                to={`/courses/${courseId}`}
                                className="lesson-viewer-back-course"
                            >
                                Back to Course
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </BaseLayout>
    );
};

export default LessonViewer;

