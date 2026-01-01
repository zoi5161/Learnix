import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService, Quiz } from '../../services/quizService'; 
import PublicNavbar from '../../components/PublicNavbar';
import './StudentQuizPage.css';

const StudentQuizPage: React.FC = () => {
    const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<number[]>([]);
    const [result, setResult] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (quizId) fetchQuiz(quizId);
    }, [quizId]);

    const fetchQuiz = async (id: string) => {
        try {
            const res = await quizService.getQuizById(id);
            if (res.success && res.data) {
                setQuiz(res.data);
                // 🛠 FIX: Đảm bảo questions tồn tại trước khi lấy length
                const questions = res.data.questions || [];
                setAnswers(new Array(questions.length).fill(-1));
            }
        } catch (error) {
            console.error(error);
            alert('Error loading quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
        if (result) return; // Nếu đã có kết quả thì không cho sửa
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (!quiz || !quizId) return;

        // Check chưa làm hết
        if (answers.includes(-1)) {
            if (!window.confirm("You haven't answered all questions. Submit anyway?")) {
                return;
            }
        }

        setSubmitting(true);
        try {
            // 🛠 FIX: Sử dụng optional chaining hoặc fallback mảng rỗng
            const currentQuestions = quiz.questions || [];
            
            const payload = {
                quizId: quizId,
                answers: currentQuestions.map((q, idx) => ({
                    questionIndex: idx,
                    selectedOption: answers[idx]
                }))
            };

            const res = await quizService.submitQuiz(payload);
            if (res.success) {
                setResult(res.data);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error(error);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="student-quiz-page">
            <PublicNavbar />
            <div className="student-quiz-container" style={{ textAlign: 'center', marginTop: 100 }}>
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-2"></div>
                <p>Loading Quiz...</p>
            </div>
        </div>
    );

    if (!quiz) return (
        <div className="student-quiz-page">
            <PublicNavbar />
            <div className="student-quiz-container" style={{ textAlign: 'center', marginTop: 100 }}>
                Quiz not found
            </div>
        </div>
    );

    // 🛠 FIX: Lấy danh sách câu hỏi an toàn
    const questionsList = quiz.questions || [];

    return (
        <div className="student-quiz-page">
            <PublicNavbar />
            
            <div className="student-quiz-container">
                <button onClick={() => navigate(`/dashboard`)} className="quiz-back-btn">
                    ← Back to Dashboard
                </button>

                {/* Header */}
                <div className="quiz-header">
                    <h1 className="quiz-title">{quiz.title}</h1>
                    <p className="quiz-description">{quiz.description}</p>
                    <div className="quiz-meta">
                        <span>⏱ Time Limit: {quiz.time_limit} mins</span>
                        <span>❓ Questions: {questionsList.length}</span>
                    </div>
                </div>

                {/* Result Board */}
                {result && (
                    <div className={`quiz-result-board ${result.passed ? 'passed' : 'failed'}`}>
                        <h2 className="quiz-result-title">
                            {result.passed ? '🎉 Passed!' : '😢 Failed'}
                        </h2>
                        <div className="quiz-result-score">
                            {result.score}%
                        </div>
                        <p className="quiz-result-text">
                            You answered {result.correctCount} out of {result.totalQuestions} correctly.
                        </p>
                        {/* Back to Course Button */}
                        {courseId && (
                            <button
                                onClick={() => navigate(`/dashboard`)}
                                className="quiz-back-to-course-btn"
                                style={{
                                    marginTop: '20px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                }}
                            >
                                ← Back to Dashboard
                            </button>
                        )}
                    </div>
                )}

                {/* Questions List */}
                <div className="quiz-questions-list">
                    {questionsList.map((q, qIndex) => {
                        let cardClass = "quiz-question-card";
                        
                        // Logic viền xanh/đỏ cho câu hỏi sau khi nộp
                        if (result) {
                            const detail = result.details?.find((d: any) => d.questionIndex === qIndex);
                            if (detail) {
                                cardClass += detail.isCorrect ? " correct-border" : " wrong-border";
                            }
                        }

                        return (
                            <div key={qIndex} className={cardClass}>
                                <h3 className="quiz-question-text">
                                    Question {qIndex + 1}: {q.question}
                                </h3>

                                <div className="quiz-options-grid">
                                    {q.options.map((opt, optIndex) => {
                                        const isSelected = answers[qIndex] === optIndex;
                                        let optionClass = "quiz-option";

                                        if (result) {
                                            optionClass += " disabled"; // Không cho click nữa
                                            const detail = result.details?.find((d: any) => d.questionIndex === qIndex);
                                            
                                            // 🛠 FIX: Logic tô màu đáp án
                                            if (detail) {
                                                if (optIndex === detail.correctAnswer) {
                                                    optionClass += " result-correct"; // Đáp án đúng hệ thống (Màu Xanh)
                                                } else if (isSelected && !detail.isCorrect) {
                                                    optionClass += " result-wrong"; // Đáp án user chọn sai (Màu Đỏ)
                                                }
                                            }
                                        } else {
                                            if (isSelected) optionClass += " selected";
                                        }

                                        return (
                                            <div 
                                                key={optIndex} 
                                                onClick={() => handleOptionSelect(qIndex, optIndex)}
                                                className={optionClass}
                                            >
                                                <span className="quiz-option-label">
                                                    {String.fromCharCode(65 + optIndex)}
                                                </span>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit Button */}
                {!result && (
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="quiz-submit-btn"
                        style={{ opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StudentQuizPage;