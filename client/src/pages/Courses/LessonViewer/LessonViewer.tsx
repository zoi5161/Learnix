import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonService } from '../../../services/lessonService';
import { programmingService, ProgrammingExercise } from '../../../services/programmingService';
import { quizService } from '../../../services/quizService';
import BaseLayout from '../../../layouts/BaseLayout';
import ProgrammingIDE from '../../../components/ProgrammingIDE/ProgrammingIDE';
import './LessonViewer.css';

// YouTube IFrame API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

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

// Utility function to extract YouTube video ID from URL (supports embed, watch, short links)
const extractYouTubeVideoId = (url: string): string | null => {
    // Handle embed URL: https://www.youtube.com/embed/VIDEO_ID
    let match = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
    if (match && match[1]) return match[1];
    
    // Handle watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    match = url.match(/youtube\.com\/watch\?v=([^&\n?#]+)/);
    if (match && match[1]) return match[1];
    
    // Handle short URL: https://youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([^&\n?#]+)/);
    if (match && match[1]) return match[1];
    
    // Handle v URL: https://www.youtube.com/v/VIDEO_ID
    match = url.match(/youtube\.com\/v\/([^&\n?#]+)/);
    if (match && match[1]) return match[1];
    
    return null;
};

// Check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
    return /youtube\.com|youtu\.be/.test(url);
};

const LessonViewer: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lessonData, setLessonData] = useState<LessonData | null>(null);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    
    const [videoProgress, setVideoProgress] = useState(0); // For video tracking
    const [textScrollProgress, setTextScrollProgress] = useState(0); // For text tracking
    const [startTime] = useState(Date.now()); // Track time spent
    
    // YouTube player refs
    const youtubePlayerRef = useRef<any>(null);
    const youtubeContainerRef = useRef<HTMLDivElement>(null);
    const [youtubeApiReady, setYoutubeApiReady] = useState(false);
    const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
    const youtubeVideoIdRef = useRef<string | null>(null);

    // Programming exercises
    const [exercises, setExercises] = useState<ProgrammingExercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<ProgrammingExercise | null>(null);
    const [loadingExercises, setLoadingExercises] = useState(false);

    // Quiz state
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [quizSubmissions, setQuizSubmissions] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchLesson = async () => {
            if (!courseId || !lessonId) return;

            try {
                setLoading(true);
                const res = await lessonService.getLesson(courseId, lessonId);
                if (res.success) {
                    setLessonData(res.data);
                    setNotes(res.data.lesson.progress?.notes || '');
                    
                    // Check if it's a YouTube video
                    if (res.data.lesson.content_type === 'video' && res.data.lesson.content.startsWith('http')) {
                        const isYouTube = isYouTubeUrl(res.data.lesson.content);
                        setIsYouTubeVideo(isYouTube);
                        
                        if (isYouTube) {
                            const videoId = extractYouTubeVideoId(res.data.lesson.content);
                            youtubeVideoIdRef.current = videoId;
                        }
                    }
                    
                    // Auto-mark as in_progress if not started
                    if (res.data.lesson.progress?.status === 'not_started') {
                        await lessonService.updateProgress(courseId, lessonId, {
                            status: 'in_progress',
                            completion_percentage: 0
                        });
                    }
                    
                    // Initialize progress tracking based on content type
                    if (res.data.lesson.content_type === 'video') {
                        setVideoProgress(res.data.lesson.progress?.completion_percentage || 0);
                    } else if (res.data.lesson.content_type === 'text') {
                        setTextScrollProgress(res.data.lesson.progress?.completion_percentage || 0);
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

    // Fetch exercises for this lesson
    useEffect(() => {
        const fetchExercises = async () => {
            if (!courseId || !lessonId) return;
            try {
                setLoadingExercises(true);
                const res = await programmingService.getExercisesByLesson(courseId, lessonId);
                if (res.success && res.data.length > 0) {
                    setExercises(res.data);
                    // Auto-select first exercise
                    const firstExerciseRes = await programmingService.getExercise(
                        courseId,
                        lessonId,
                        res.data[0]._id
                    );
                    if (firstExerciseRes.success) {
                        setSelectedExercise(firstExerciseRes.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching exercises:', error);
            } finally {
                setLoadingExercises(false);
            }
        };

        fetchExercises();
    }, [courseId, lessonId]);

    // Load YouTube IFrame API
    useEffect(() => {
        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            setYoutubeApiReady(true);
            return;
        }

        // Check if script is already being loaded
        if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            // Script exists, wait for callback
            window.onYouTubeIframeAPIReady = () => {
                setYoutubeApiReady(true);
            };
            return;
        }

        // Load YouTube IFrame API script
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        // Set callback when API is ready
        window.onYouTubeIframeAPIReady = () => {
            setYoutubeApiReady(true);
        };

        return () => {
            // Cleanup - reset callback
            (window as any).onYouTubeIframeAPIReady = undefined;
        };
    }, []);

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
                // Fetch quizzes for this lesson after completion
                fetchQuizzesForLesson();
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    // Fetch quizzes for current lesson
    const fetchQuizzesForLesson = async () => {
        if (!courseId || !lessonId) return;
        
        try {
            setLoadingQuizzes(true);
            const res = await quizService.getQuizzes({ 
                course_id: courseId,
                lesson_id: lessonId 
            });
            
            if (res.success && res.data?.quizzes) {
                setQuizzes(res.data.quizzes);
                // Fetch submissions for each quiz
                fetchQuizSubmissions(res.data.quizzes);
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    // Fetch submissions for quizzes
    const fetchQuizSubmissions = async (quizList: any[]) => {
        try {
            // Get all submissions for this course
            const submissionsRes = await quizService.getMySubmissions(courseId);
            if (submissionsRes.success && submissionsRes.data) {
                const submissionsMap: Record<string, any> = {};
                
                // Group submissions by quiz_id
                quizList.forEach(quiz => {
                    const quizId = quiz._id || quiz.id;
                    const quizSubs = submissionsRes.data.filter((sub: any) => {
                        const subQuizId = typeof sub.quiz_id === 'object' ? sub.quiz_id._id : sub.quiz_id;
                        return subQuizId === quizId;
                    }).sort((a: any, b: any) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    
                    if (quizSubs.length > 0) {
                        const bestScore = Math.max(...quizSubs.map((s: any) => s.score || 0));
                        const lastScore = quizSubs[0].score || 0;
                        const lastSubmission = quizSubs[0];
                        
                        submissionsMap[quizId] = {
                            attempts: quizSubs.length,
                            bestScore,
                            lastScore,
                            lastSubmission,
                            passed: lastScore >= (quiz.passing_score || 70)
                        };
                    }
                });
                
                setQuizSubmissions(submissionsMap);
            }
        } catch (err) {
            console.error('Error fetching quiz submissions:', err);
        }
    };

    // Fetch quizzes when lesson is completed
    useEffect(() => {
        if (lessonData?.lesson.progress?.status === 'completed') {
            fetchQuizzesForLesson();
        }
    }, [lessonData?.lesson.progress?.status, courseId, lessonId]);

    const handleQuizClick = (quizId: string) => {
        if (!courseId) return;
        navigate(`/courses/${courseId}/quizzes/${quizId}/take`);
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

    // Initialize YouTube Player
    useEffect(() => {
        if (!youtubeApiReady || !isYouTubeVideo || !youtubeVideoIdRef.current || !youtubeContainerRef.current) {
            return;
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            // Destroy existing player if any
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    // Ignore errors
                }
            }

            // Create new YouTube player
            try {
                youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
                    videoId: youtubeVideoIdRef.current,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                    },
                    events: {
                        onReady: () => {
                            console.log('YouTube player ready');
                        },
                        onStateChange: (event: any) => {
                            if (event.data === window.YT.PlayerState.ENDED) {
                                // Video ended - update progress to 100% but don't auto-complete
                                handleYouTubeProgress(100);
                            } else if (event.data === window.YT.PlayerState.PLAYING) {
                                startYouTubeProgressTracking();
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                stopYouTubeProgressTracking();
                            }
                        },
                    },
                });
            } catch (error) {
                console.error('Error creating YouTube player:', error);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            stopYouTubeProgressTracking();
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    // Ignore errors
                }
                youtubePlayerRef.current = null;
            }
        };
    }, [youtubeApiReady, isYouTubeVideo, youtubeVideoIdRef.current]);

    // YouTube progress tracking interval
    const youtubeProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startYouTubeProgressTracking = () => {
        // Clear existing interval
        if (youtubeProgressIntervalRef.current) {
            clearInterval(youtubeProgressIntervalRef.current);
        }

        // Track progress every 2 seconds
        youtubeProgressIntervalRef.current = setInterval(() => {
            if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
                try {
                    const currentTime = youtubePlayerRef.current.getCurrentTime();
                    const duration = youtubePlayerRef.current.getDuration();
                    
                    if (duration > 0) {
                        const progress = Math.round((currentTime / duration) * 100);
                        handleYouTubeProgress(progress);
                    }
                } catch (e) {
                    console.error('Error getting YouTube progress:', e);
                }
            }
        }, 5000); // Update every 2 seconds
    };

    const stopYouTubeProgressTracking = () => {
        if (youtubeProgressIntervalRef.current) {
            clearInterval(youtubeProgressIntervalRef.current);
            youtubeProgressIntervalRef.current = null;
        }
    };

    // Handle YouTube progress update
    const handleYouTubeProgress = async (progress: number) => {
        if (!courseId || !lessonId) return;
        
        // Only update if progress increased significantly (every 5% for YouTube)
        if (Math.abs(progress - videoProgress) < 5 && progress < 100) {
            return;
        }

        setVideoProgress(progress);

        try {
            // Calculate time spent
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            const currentStatus = lessonData?.lesson.progress?.status as 'not_started' | 'in_progress' | 'completed' | undefined;
            
            // Only update progress percentage and time_spent, keep current status (don't auto-complete)
            await lessonService.updateProgress(courseId, lessonId, {
                completion_percentage: progress,
                time_spent: timeSpent,
                status: currentStatus || 'in_progress' // Keep current status, don't auto-change to completed
            });

            // Update local state
            if (lessonData) {
                setLessonData({
                    ...lessonData,
                    lesson: {
                        ...lessonData.lesson,
                        progress: {
                            ...lessonData.lesson.progress!,
                            completion_percentage: progress,
                            time_spent: timeSpent
                            // Keep status unchanged
                        }
                    }
                });
            }
        } catch (err) {
            // Silently fail to avoid interrupting user experience
            console.error('Error updating YouTube progress:', err);
        }
    };

    // Update video progress (throttled to avoid too many API calls) - for HTML5 video
    const handleVideoProgress = async (progress: number) => {
        if (!courseId || !lessonId || isYouTubeVideo) return; // Skip if YouTube video
        
        // Only update if progress increased significantly (every 10%)
        if (Math.abs(progress - videoProgress) < 10 && progress < 100) {
            return;
        }

        setVideoProgress(progress);

        try {
            // Calculate time spent
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            const currentStatus = lessonData?.lesson.progress?.status as 'not_started' | 'in_progress' | 'completed' | undefined;
            await lessonService.updateProgress(courseId, lessonId, {
                completion_percentage: progress,
                time_spent: timeSpent,
                status: currentStatus || 'in_progress' // Keep current status, don't auto-change
            });

            // Update local state
            if (lessonData) {
                setLessonData({
                    ...lessonData,
                    lesson: {
                        ...lessonData.lesson,
                        progress: {
                            ...lessonData.lesson.progress!,
                            completion_percentage: progress,
                            time_spent: timeSpent
                        }
                    }
                });
            }
        } catch (err) {
            // Silently fail to avoid interrupting user experience
            console.error('Error updating video progress:', err);
        }
    };

    // Update text scroll progress (throttled)
    const handleTextScrollProgress = async (progress: number) => {
        if (!courseId || !lessonId) return;
        
        // Only update if progress increased significantly (every 10%)
        if (Math.abs(progress - textScrollProgress) < 10 && progress < 100) {
            return;
        }

        setTextScrollProgress(progress);

        try {
            // Calculate time spent
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            const currentStatus = lessonData?.lesson.progress?.status as 'not_started' | 'in_progress' | 'completed' | undefined;
            await lessonService.updateProgress(courseId, lessonId, {
                completion_percentage: progress,
                time_spent: timeSpent,
                status: currentStatus || 'in_progress' // Keep current status, don't auto-change
            });

            // Update local state
            if (lessonData) {
                setLessonData({
                    ...lessonData,
                    lesson: {
                        ...lessonData.lesson,
                        progress: {
                            ...lessonData.lesson.progress!,
                            completion_percentage: progress,
                            time_spent: timeSpent
                        }
                    }
                });
            }
        } catch (err) {
            // Silently fail to avoid interrupting user experience
            console.error('Error updating text progress:', err);
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
                            isYouTubeVideo && youtubeApiReady && youtubeVideoIdRef.current ? (
                                // YouTube video with API tracking
                                <div className="lesson-viewer-youtube-wrapper">
                                    <div ref={youtubeContainerRef} className="lesson-viewer-youtube-player"></div>
                                </div>
                            ) : (
                                // Other iframe videos (Vimeo, etc.) - no tracking
                                <div className="lesson-viewer-iframe-wrapper">
                                    <iframe
                                        src={lesson.content}
                                        className="lesson-viewer-video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={lesson.title}
                                    ></iframe>
                                    <div className="lesson-viewer-iframe-note">
                                        <p>Note: Progress tracking for this video type is limited. 
                                        Please mark this lesson as complete when finished.</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            // HTML5 video with native tracking
                            <video
                                src={lesson.content}
                                controls
                                className="lesson-viewer-video"
                                onTimeUpdate={(e) => {
                                    const video = e.currentTarget;
                                    if (video.duration) {
                                        const progress = Math.round((video.currentTime / video.duration) * 100);
                                        handleVideoProgress(progress);
                                    }
                                }}
                                onLoadedMetadata={(e) => {
                                    const video = e.currentTarget;
                                    if (video.duration && video.currentTime > 0) {
                                        const progress = Math.round((video.currentTime / video.duration) * 100);
                                        handleVideoProgress(progress);
                                    }
                                }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                );

            case 'text':
                return (
                    <div 
                        className="lesson-viewer-text-content"
                        onScroll={(e) => {
                            const element = e.currentTarget;
                            const scrollTop = element.scrollTop;
                            const scrollHeight = element.scrollHeight - element.clientHeight;
                            if (scrollHeight > 0) {
                                const progress = Math.round((scrollTop / scrollHeight) * 100);
                                handleTextScrollProgress(progress);
                            }
                        }}
                    >
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
                                <div className="lesson-viewer-progress-info-row">
                                    <span className="lesson-viewer-progress-text">
                                        {lesson.progress.completion_percentage}% Complete
                                    </span>
                                    {lesson.progress.time_spent > 0 && (
                                        <span className="lesson-viewer-time-spent">
                                            Time spent: {Math.round(lesson.progress.time_spent / 60)} min
                                        </span>
                                    )}
                                </div>
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

                        {/* Quiz Section - Only show when lesson is completed */}
                        {isCompleted && (
                            <div className="lesson-viewer-quiz-section">
                                <h3 className="lesson-viewer-quiz-section-title">📝 Quiz</h3>
                                {loadingQuizzes ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                        Loading quizzes...
                                    </div>
                                ) : quizzes.length > 0 ? (
                                    <div className="lesson-viewer-quiz-list">
                                        {quizzes.map((quiz) => {
                                            const quizId = quiz._id || quiz.id;
                                            const submission = quizSubmissions[quizId];
                                            const hasSubmission = !!submission;
                                            
                                            return (
                                                <div key={quizId} className="lesson-viewer-quiz-card">
                                                    <div className="lesson-viewer-quiz-card-header">
                                                        <h4 className="lesson-viewer-quiz-card-title">{quiz.title}</h4>
                                                        <span className="lesson-viewer-quiz-badge">Quiz</span>
                                                    </div>
                                                    <div className="lesson-viewer-quiz-card-meta">
                                                        <span>❓ {quiz.questionsCount || quiz.questions?.length || 0} Questions</span>
                                                        {quiz.time_limit > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>⏱ {quiz.time_limit} mins</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Submission Info */}
                                                    {hasSubmission && (
                                                        <div className="lesson-viewer-quiz-submission-info" style={{
                                                            marginTop: '12px',
                                                            padding: '12px',
                                                            backgroundColor: '#f0f9ff',
                                                            border: '1px solid #bae6fd',
                                                            borderRadius: '6px',
                                                            fontSize: '14px'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                <span style={{ color: '#0369a1', fontWeight: '500' }}>📊 Your Results:</span>
                                                                <span style={{ 
                                                                    color: submission.passed ? '#16a34a' : '#dc2626',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {submission.passed ? '✓ Passed' : '✗ Failed'}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                                                <div>
                                                                    <span style={{ color: '#64748b' }}>Last Score: </span>
                                                                    <strong style={{ color: '#0369a1' }}>{submission.lastScore}%</strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ color: '#64748b' }}>Best Score: </span>
                                                                    <strong style={{ color: '#059669' }}>{submission.bestScore}%</strong>
                                                                </div>
                                                                <div style={{ gridColumn: 'span 2' }}>
                                                                    <span style={{ color: '#64748b' }}>Attempts: </span>
                                                                    <strong style={{ color: '#0369a1' }}>{submission.attempts}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleQuizClick(quizId)}
                                                        className="lesson-viewer-quiz-start-btn"
                                                        style={{
                                                            marginTop: hasSubmission ? '12px' : '0'
                                                        }}
                                                    >
                                                        {hasSubmission ? 'Retake Quiz →' : 'Start Quiz →'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
                                        No quiz available for this lesson.
                                    </p>
                                )}
                            </div>
                        )}

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

                        {/* Programming Exercises Section */}
                        {loadingExercises ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                Loading exercises...
                            </div>
                        ) : exercises.length > 0 && (
                            <div className="lesson-viewer-exercises">
                                <h3 className="lesson-viewer-exercises-title">💻 Programming Exercises</h3>
                                
                                {exercises.length > 1 && (
                                    <div className="lesson-viewer-exercise-selector">
                                        {exercises.map(exercise => (
                                            <button
                                                key={exercise._id}
                                                onClick={async () => {
                                                    try {
                                                        const res = await programmingService.getExercise(
                                                            courseId!,
                                                            lessonId!,
                                                            exercise._id
                                                        );
                                                        if (res.success) {
                                                            setSelectedExercise(res.data);
                                                        }
                                                    } catch (error) {
                                                        console.error('Error loading exercise:', error);
                                                    }
                                                }}
                                                className={`lesson-viewer-exercise-tab ${
                                                    selectedExercise?._id === exercise._id ? 'active' : ''
                                                }`}
                                            >
                                                {exercise.title}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedExercise && courseId && lessonId && (
                                    <ProgrammingIDE
                                        courseId={courseId}
                                        lessonId={lessonId}
                                        exercise={selectedExercise}
                                        onSubmissionComplete={(submission) => {
                                            // Refresh exercise data
                                            programmingService.getExercise(
                                                courseId,
                                                lessonId,
                                                selectedExercise._id
                                            ).then(res => {
                                                if (res.success) {
                                                    setSelectedExercise(res.data);
                                                }
                                            });
                                        }}
                                    />
                                )}
                            </div>
                        )}
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

