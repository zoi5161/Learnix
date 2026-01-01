import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import { studentService } from '../../services/studentService';
import { enrollmentService } from '../../services/enrollmentService';
import { quizService } from '../../services/quizService';
import BaseLayout from '../../layouts/BaseLayout';
import './StudentDashboard.css';

// --- Interfaces ---

interface QuizAnswer {
    _id: string;
    question_id: string;
    answer: string;
    is_correct: boolean;
    points_earned: number;
}

interface QuizSubmission {
    _id: string;
    quiz_id: {
        _id: string;
        title: string;
        course_id?: string;
    };
    student_id: string;
    attempt_number: number;
    answers: QuizAnswer[];
    score: number;          // Điểm quy đổi (%)
    total_points: number;   // Tổng điểm gốc
    passed: boolean;        // Calculated field (nếu API thiếu)
    createdAt: string;
}

// --- SUB-COMPONENT: Modal Review ---
const QuizReviewModal: React.FC<{
    submission: QuizSubmission | null;
    onClose: () => void;
    onRetake: (courseId: string, quizId: string) => void;
}> = ({ submission, onClose, onRetake }) => {
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    useEffect(() => {
        if (submission?.quiz_id?._id) {
            loadQuizQuestions(submission.quiz_id._id);
        }
    }, [submission]);

    const loadQuizQuestions = async (quizId: string) => {
        setLoadingQuestions(true);
        try {
            const res = await quizService.getQuizById(quizId);
            if (res.success && res.data?.questions) {
                setQuizQuestions(res.data.questions);
            }
        } catch (err) {
            console.error('Failed to load quiz questions:', err);
        } finally {
            setLoadingQuestions(false);
        }
    };

    if (!submission) return null;

    // Tính toán tổng điểm đạt được từ answers
    const totalPointsEarned = submission.answers.reduce((acc, curr) => acc + curr.points_earned, 0);

    // Map submission answers với questions để hiển thị đầy đủ
    const getQuestionByIndex = (index: number) => {
        return quizQuestions[index] || null;
    };

    const getSelectedOptionIndex = (answerText: string, questionIndex: number) => {
        const question = getQuestionByIndex(questionIndex);
        if (!question) return -1;
        return question.options.findIndex((opt: string) => opt === answerText);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Review: {submission.quiz_id?.title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* CARD TỔNG QUAN */}
                    <div className="review-summary-card">
                        <div className="review-stats-grid">
                            <div className="review-stat-item">
                                <span className="label">Attempt #</span>
                                <span className="value">{submission.attempt_number}</span>
                            </div>
                            <div className="review-stat-item">
                                <span className="label">Score</span>
                                <span className={`value ${submission.passed ? 'text-green' : 'text-orange'}`}>
                                    {submission.score}%
                                </span>
                            </div>
                            <div className="review-stat-item">
                                <span className="label">Result</span>
                                <span className={`badge ${submission.passed ? 'badge-pass' : 'badge-fail'}`}>
                                    {submission.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                            <div className="review-stat-item">
                                <span className="label">Date</span>
                                <span className="value-sm">{new Date(submission.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* DANH SÁCH CHI TIẾT CÂU TRẢ LỜI */}
                    <h4 className="text-xl font-semibold mb-4 text-gray-800">Detailed Answers</h4>

                    {loadingQuestions ? (
                        <div className="text-center py-8">
                            <div className="student-dashboard-spinner" style={{ margin: '0 auto 16px' }}></div>
                            <p className="text-gray-500">Loading questions...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submission.answers.map((ans, index) => {
                                const question = getQuestionByIndex(index);
                                const selectedOptionIndex = question 
                                    ? question.options.findIndex((opt: string) => opt === ans.answer)
                                    : -1;
                                const correctOptionIndex = question ? question.correctAnswer : -1;

                                return (
                                    <div
                                        key={ans._id || index}
                                        className={`quiz-review-question-card rounded-lg border p-4 shadow-sm transition-all 
                                            ${ans.is_correct
                                                ? 'border-green-300 bg-green-50 hover:shadow-md'
                                                : 'border-red-300 bg-red-50 hover:shadow-md'
                                            }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Question {index + 1}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-semibold 
                                                    ${ans.is_correct
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                    }`}
                                            >
                                                {ans.is_correct
                                                    ? `Correct (+${ans.points_earned})`
                                                    : 'Incorrect (0)'}
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        {question && (
                                            <div className="mb-4">
                                                <p className="text-base font-semibold text-gray-900 mb-3">
                                                    {question.question}
                                                </p>
                                                
                                                {/* Options */}
                                                <div className="space-y-2">
                                                    {question.options.map((option: string, optIndex: number) => {
                                                        const isSelected = optIndex === selectedOptionIndex;
                                                        const isCorrect = optIndex === correctOptionIndex;
                                                        
                                                        return (
                                                            <div
                                                                key={optIndex}
                                                                className={`quiz-review-option p-3 rounded-lg border-2 transition-all
                                                                    ${isCorrect 
                                                                        ? 'border-green-500 bg-green-100' 
                                                                        : isSelected && !isCorrect
                                                                        ? 'border-red-500 bg-red-100'
                                                                        : 'border-gray-200 bg-white'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                                                                        ${isCorrect 
                                                                            ? 'bg-green-500 text-white' 
                                                                            : isSelected && !isCorrect
                                                                            ? 'bg-red-500 text-white'
                                                                            : 'bg-gray-200 text-gray-700'
                                                                        }`}>
                                                                        {String.fromCharCode(65 + optIndex)}
                                                                    </span>
                                                                    <span className={`flex-1
                                                                        ${isCorrect ? 'font-semibold text-green-800' : ''}
                                                                        ${isSelected && !isCorrect ? 'font-semibold text-red-800' : ''}
                                                                    `}>
                                                                        {option}
                                                                    </span>
                                                                    {isCorrect && (
                                                                        <span className="text-green-600 font-bold text-sm">✓ Correct</span>
                                                                    )}
                                                                    {isSelected && !isCorrect && (
                                                                        <span className="text-red-600 font-bold text-sm">✗ Your Answer</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Fallback nếu không có question data */}
                                        {!question && (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <span className="text-gray-600 min-w-28">Your Answer:</span>
                                                    <span className="font-bold text-gray-900">{ans.answer}</span>
                                                </div>
                                                {!ans.is_correct && (
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-600 min-w-28">Result:</span>
                                                        <span className="font-semibold text-red-600">0 points</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {submission.answers.length === 0 && (
                                <p className="text-gray-500 text-center py-6">
                                    No detailed answers available for this submission.
                                </p>
                            )}
                        </div>
                    )}

                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            if (submission.quiz_id.course_id) {
                                onRetake(submission.quiz_id.course_id, submission.quiz_id._id);
                            }
                        }}
                    >
                        Retake Quiz
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const dataFetchedRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [studentData, setStudentData] = useState<any>(null);
    const [quizHistory, setQuizHistory] = useState<QuizSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);

    const [quizMetrics, setQuizMetrics] = useState({
        totalTaken: 0,
        averageScore: 0,
        passedCount: 0
    });

    const refreshEnrollments = async () => {
        try {
            const dashboardRes = await studentService.getDashboard();
            if (dashboardRes.success) {
                setStudentData(dashboardRes.data);
            }
        } catch (err) {
            console.error('Failed to refresh enrollments', err);
        }
    };

    useEffect(() => {
        const currentUser = getUserFromToken();
        if (!currentUser || currentUser.role !== 'student') {
            navigate('/login');
            return;
        }

        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;

        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [dashboardRes, quizRes] = await Promise.all([
                    studentService.getDashboard(),
                    quizService.getMySubmissions()
                ]);

                // 1. Xử lý Dashboard Data
                if (dashboardRes.success) {
                    setStudentData(dashboardRes.data);
                }

                // 2. Xử lý Quiz Data
                if (quizRes.success) {
                    const rawSubmissions = quizRes.data || [];

                    // 🔥 NORMALIZE DATA: Đảm bảo field 'passed' tồn tại
                    // Nếu API không trả về 'passed', ta tự tính (ví dụ score >= 50)
                    const normalizedSubmissions: QuizSubmission[] = rawSubmissions.map((item: any) => ({
                        ...item,
                        passed: item.passed !== undefined ? item.passed : (item.score >= 50)
                    }));

                    setQuizHistory(normalizedSubmissions);

                    if (normalizedSubmissions.length > 0) {
                        const totalTaken = normalizedSubmissions.length;
                        const totalScore = normalizedSubmissions.reduce((sum, sub) => sum + sub.score, 0);
                        // 🔥 FIX TYPO: s.s -> s.passed
                        const passedCount = normalizedSubmissions.filter(s => s.passed).length;

                        setQuizMetrics({
                            totalTaken,
                            averageScore: Math.round(totalScore / totalTaken),
                            passedCount
                        });
                    }
                }
            } catch (err: any) {
                console.error('Dashboard Load Error:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    const handleRetake = (courseId: string, quizId: string) => {
        if (window.confirm('Retake quiz?')) {
            navigate(`/courses/${courseId}/quizzes/${quizId}/take?retake=true`);
        }
    };

    const handleUnenroll = async (courseId: string) => {
        const confirmed = window.confirm('Do you really want to unenroll from this course?');
        if (!confirmed) return;

        try {
            const res = await enrollmentService.unenrollCourse(courseId);
            if (res.success) {
                alert('Successfully unenrolled from course');
                await refreshEnrollments();
            } else {
                alert('Failed to unenroll: ' + res.message);
            }
        } catch (err: any) {
            alert('Error: ' + (err.message || 'Failed to unenroll'));
        }
    };

    if (loading) return (
        <BaseLayout>
            <div className="student-dashboard-loading">
                <div className="student-dashboard-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        </BaseLayout>
    );

    if (error || !studentData) return (
        <BaseLayout>
            <div className="student-dashboard-error"><p>{error}</p></div>
        </BaseLayout>
    );

    return (
        <BaseLayout>
            <div className="student-dashboard">
                {/* --- HEADER & BUDGET --- */}
                <div className="student-dashboard-header">
                    <h1 className="student-dashboard-title">Welcome, {studentData.student.name}!</h1>
                    <div className="student-dashboard-budget">
                        <div className="student-dashboard-budget-item">
                            <span className="student-dashboard-budget-label">Budget:</span>
                            <span className="student-dashboard-budget-value">${studentData.student.budget.toFixed(2)}</span>
                        </div>
                        <div className="student-dashboard-budget-item">
                            <span className="student-dashboard-budget-label">Bonus:</span>
                            <span className="student-dashboard-budget-value student-dashboard-budget-bonus">${studentData.student.bonus_credits.toFixed(2)}</span>
                        </div>
                        <div className="student-dashboard-budget-item student-dashboard-budget-total">
                            <span className="student-dashboard-budget-label">Total:</span>
                            <span className="student-dashboard-budget-value">${studentData.student.total_budget.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* --- STATS CARDS --- */}
                <div className="student-dashboard-stats">
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Enrolled</h3>
                        <p className="student-dashboard-stat-value">{studentData.statistics.totalEnrolled}</p>
                    </div>
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Quizzes</h3>
                        <p className="student-dashboard-stat-value">{quizMetrics.totalTaken}</p>
                    </div>
                    <div className="student-dashboard-stat-card">
                        <h3 className="student-dashboard-stat-title">Avg Score</h3>
                        <p className="student-dashboard-stat-value" style={{ color: quizMetrics.averageScore >= 70 ? '#10b981' : '#f59e0b' }}>
                            {quizMetrics.averageScore}%
                        </p>
                    </div>
                </div>

                {/* --- RECENT QUIZ ACTIVITY TABLE --- */}
                {quizHistory.length > 0 && (
                    <section className="student-dashboard-section">
                        <h2 className="student-dashboard-section-title">Recent Quiz Activity</h2>
                        
                        {/* Desktop Table View */}
                        <div className="quiz-activity-table-wrapper hidden md:block bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {quizHistory.slice(0, 5).map((sub) => (
                                        <tr key={sub._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sub.quiz_id?.title || 'Unknown Quiz'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${sub.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {sub.score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold bg-transparent border-none cursor-pointer"
                                                >
                                                    Review
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (sub.quiz_id.course_id) handleRetake(sub.quiz_id.course_id, sub.quiz_id._id)
                                                    }}
                                                    className="text-orange-600 hover:text-orange-900 font-semibold bg-transparent border-none cursor-pointer"
                                                >
                                                    Retake
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="quiz-activity-cards md:hidden space-y-4">
                            {quizHistory.slice(0, 5).map((sub) => (
                                <div key={sub._id} className="quiz-activity-card bg-white rounded-lg shadow border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">
                                            {sub.quiz_id?.title || 'Unknown Quiz'}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full flex-shrink-0 ${sub.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {sub.score}%
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mb-4">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedSubmission(sub)}
                                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors"
                                        >
                                            Review
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (sub.quiz_id.course_id) handleRetake(sub.quiz_id.course_id, sub.quiz_id._id)
                                            }}
                                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold text-sm transition-colors"
                                        >
                                            Retake
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- MY COURSES --- */}
                <section className="student-dashboard-section" style={{ marginTop: 30 }}>
                    <h2 className="student-dashboard-section-title">My Courses</h2>
                    {studentData.enrolledCourses.length > 0 ? (
                        <div className="student-dashboard-courses-grid">
                            {studentData.enrolledCourses.map((course: any) => (
                                <div key={course._id} className="student-dashboard-course-card">
                                    <div className="student-dashboard-course-thumbnail">
                                        <img 
                                            src={course.thumbnail || '/logo.png'} 
                                            alt={course.title}
                                            onError={(e) => {
                                                e.currentTarget.src = '/logo.png';
                                            }}
                                        />
                                    </div>

                                    <div className="student-dashboard-course-content">
                                        <h3 className="student-dashboard-course-title">
                                            <Link to={`/courses/${course._id}`}>{course.title}</Link>
                                        </h3>
                                        <div className="student-dashboard-course-progress">
                                            <div className="student-dashboard-course-progress-bar">
                                                <div
                                                    className="student-dashboard-course-progress-fill"
                                                    style={{ width: `${course.progress.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="student-dashboard-course-progress-text">
                                                {course.progress.percentage}% Complete
                                            </span>
                                        </div>
                                        <div className="student-dashboard-course-actions">
                                            <Link
                                                to={`/courses/${course._id}/learn`}
                                                className="student-dashboard-course-button student-dashboard-course-button-primary"
                                            >
                                                Continue
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleUnenroll(course._id)}
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
                        <p className="text-gray-500">You are not enrolled in any courses yet.</p>
                    )}
                </section>
            </div>

            {/* --- MODAL --- */}
            {selectedSubmission && (
                <QuizReviewModal
                    submission={selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onRetake={handleRetake}
                />
            )}
        </BaseLayout>
    );
};

export default StudentDashboard;