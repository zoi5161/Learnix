import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';
import quizService from '../../services/quizService';
import { getUserFromToken } from '../../utils/authToken';
import api from '../../services/axiosInstance';

type Submission = {
    _id: string;
    student_id: {
        _id: string;
        name: string;
        email: string;
    };
    score: number;
    total_points: number;
    answers: Array<{
        question_id: string;
        answer: string;
        is_correct: boolean;
        points_earned: number;
    }>;
    attempt_number: number;
    createdAt: string;
};

type Question = {
    _id: string;
    question_text: string;
    options: Array<{
        text: string;
        is_correct: boolean;
    }>;
    order: number;
};

const QuizSubmissionsPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const user = getUserFromToken();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [quizTitle, setQuizTitle] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            navigate('/dashboard');
            return;
        }
        if (quizId) {
            loadData();
        }
    }, [quizId]);

    const loadData = async () => {
        if (!quizId) return;
        setLoading(true);
        try {
            // Load quiz info
            const quizRes = await quizService.getQuizById(quizId);
            if (quizRes.success) {
                setQuizTitle(quizRes.data.title || 'Quiz');
            }

            // Load submissions
            const subsRes = await quizService.getQuizSubmissions(quizId);
            if (subsRes.success) {
                setSubmissions(subsRes.data || []);
            }

            // Load questions
            const questionsRes = await api.get(`/quizzes/${quizId}`);
            if (questionsRes.data?.success && questionsRes.data.data?.questions) {
                // Map questions from quiz format to our format
                const qs = questionsRes.data.data.questions.map((q: any) => ({
                    _id: q._id,
                    question_text: q.question,
                    options: q.options.map((opt: string, idx: number) => ({
                        text: opt,
                        is_correct: idx === q.correctAnswer
                    })),
                    order: q.order || 0
                }));
                setQuestions(qs.sort((a: Question, b: Question) => a.order - b.order));
            }
        } catch (err: any) {
            alert('Failed to load submissions: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getQuestionById = (questionId: string) => {
        return questions.find(q => q._id === questionId);
    };

    const getAnswerText = (submission: Submission, questionId: string) => {
        const answer = submission.answers.find(a => a.question_id === questionId);
        return answer?.answer || 'No answer';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <BaseLayout>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center">Loading...</div>
                    </div>
                </div>
            </BaseLayout>
        );
    }

    return (
        <BaseLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/quizzes')}
                            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Quizzes
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Quiz Submissions</h1>
                        <p className="text-gray-600 mt-2">{quizTitle}</p>
                    </div>

                    {/* Submissions List */}
                    {submissions.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            No submissions yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Submissions List */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b">
                                        <h2 className="font-semibold text-gray-900">
                                            Submissions ({submissions.length})
                                        </h2>
                                    </div>
                                    <div className="divide-y max-h-[600px] overflow-y-auto">
                                        {submissions.map((sub) => (
                                            <div
                                                key={sub._id}
                                                onClick={() => setSelectedSubmission(sub)}
                                                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                                                    selectedSubmission?._id === sub._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {sub.student_id.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {sub.student_id.email}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {formatDate(sub.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${
                                                            sub.score >= 70 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {sub.score}%
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Attempt #{sub.attempt_number}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Submission Details */}
                            <div className="lg:col-span-2">
                                {selectedSubmission ? (
                                    <div className="bg-white rounded-lg shadow">
                                        <div className="p-6 border-b">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">
                                                        {selectedSubmission.student_id.name}
                                                    </h2>
                                                    <p className="text-gray-600">{selectedSubmission.student_id.email}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Submitted: {formatDate(selectedSubmission.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-3xl font-bold ${
                                                        selectedSubmission.score >= 70 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {selectedSubmission.score}%
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {selectedSubmission.score >= 70 ? 'Passed' : 'Failed'}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Attempt #{selectedSubmission.attempt_number}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            {questions.map((q, idx) => {
                                                const answer = selectedSubmission.answers.find(
                                                    a => a.question_id === q._id
                                                );
                                                const isCorrect = answer?.is_correct || false;
                                                const answerText = answer?.answer || 'No answer';

                                                return (
                                                    <div
                                                        key={q._id}
                                                        className={`p-4 border-2 rounded-lg ${
                                                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                Question {idx + 1}: {q.question_text}
                                                            </h3>
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                            }`}>
                                                                {isCorrect ? 'Correct' : 'Incorrect'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            {q.options.map((opt, optIdx) => {
                                                                const isSelected = opt.text === answerText;
                                                                const isCorrectOption = opt.is_correct;
                                                                return (
                                                                    <div
                                                                        key={optIdx}
                                                                        className={`p-2 rounded border ${
                                                                            isSelected && isCorrectOption
                                                                                ? 'bg-green-100 border-green-400'
                                                                                : isSelected && !isCorrectOption
                                                                                ? 'bg-red-100 border-red-400'
                                                                                : isCorrectOption
                                                                                ? 'bg-blue-50 border-blue-300'
                                                                                : 'bg-gray-50 border-gray-200'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium">
                                                                                {String.fromCharCode(65 + optIdx)}:
                                                                            </span>
                                                                            <span>{opt.text}</span>
                                                                            {isCorrectOption && (
                                                                                <span className="ml-auto text-xs text-green-700 font-semibold">
                                                                                    ✓ Correct Answer
                                                                                </span>
                                                                            )}
                                                                            {isSelected && (
                                                                                <span className="ml-auto text-xs text-blue-700 font-semibold">
                                                                                    Student's Choice
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="mt-2 text-sm text-gray-600">
                                                            Points: {answer?.points_earned || 0} / {q.options.length}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                                        Select a submission to view details
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BaseLayout>
    );
};

export default QuizSubmissionsPage;

