import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate, useParams } from 'react-router-dom';
import quizService, { QuizQuestion } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';

// Type Form
type QuizFormState = {
    title: string;
    course_id: string;
    lesson_id: string;
    description: string;
    time_limit: number;
    is_published: boolean;
    questions: QuizQuestion[];
};

const defaultQuestion = (): QuizQuestion => ({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
});

const defaultForm: QuizFormState = {
    title: '',
    course_id: '',
    lesson_id: '',
    description: '',
    time_limit: 30,
    is_published: false,
    questions: [defaultQuestion()],
};

const QuizFormPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const [form, setForm] = useState<QuizFormState>(defaultForm);
    const [courses, setCourses] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Load danh sách Course khi vào trang
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await courseService.getCourses();
                setCourses(res.data.courses || []);
            } catch (err) { console.error(err); }
        };
        fetchCourses();
    }, []);

    // 2. Load Data Quiz để Edit (Logic quan trọng)
    useEffect(() => {
        if (!id) return;

        const fetchQuizData = async () => {
            try {
                const res = await quizService.getQuizById(id);
                const data = res.data as any;

                // Xử lý an toàn: Lấy ID từ object nếu đã populate
                const courseIdVal = data.course_id?._id || data.course_id || '';
                const lessonIdVal = data.lesson_id?._id || data.lesson_id || '';

                // 👇 QUAN TRỌNG: Load danh sách lesson của course này NGAY LẬP TỨC
                // để dropdown hiển thị đúng tên bài học thay vì rỗng
                if (courseIdVal) {
                    const lessonRes = await lessonService.getManagementLessons(courseIdVal);
                    if (lessonRes.success) {
                        setLessons(lessonRes.data);
                    }
                }

                // Fill dữ liệu vào Form
                setForm({
                    title: data.title,
                    course_id: courseIdVal,
                    lesson_id: lessonIdVal,
                    description: data.description || '',
                    time_limit: data.time_limit || 30,
                    is_published: data.is_active ?? true, // Map is_active -> is_published
                    // Map questions và đảm bảo correctAnswer tồn tại (nhờ Controller đã sửa ở B1)
                    questions: data.questions.map((q: any) => ({
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correctAnswer ?? 0
                    }))
                });
            } catch (err) {
                console.error(err);
                alert('Failed to load quiz data');
            }
        };

        fetchQuizData();
    }, [id]);

    // 3. Handle khi user tự thay đổi Course trên giao diện
    const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCourseId = e.target.value;
        setForm(prev => ({ ...prev, course_id: newCourseId, lesson_id: '' })); // Reset lesson

        if (newCourseId) {
            try {
                const res = await lessonService.getManagementLessons(newCourseId);
                setLessons(res.data || []);
            } catch (error) {
                console.error(error);
                setLessons([]);
            }
        } else {
            setLessons([]);
        }
    };

    // ... (Các hàm handleQuestionChange, addQuestion, removeQuestion giữ nguyên như cũ)
    const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
        const newQuestions = [...form.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setForm({ ...form, questions: newQuestions });
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...form.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[optIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setForm({ ...form, questions: newQuestions });
    };

    const addQuestion = () => setForm(prev => ({ ...prev, questions: [...prev.questions, defaultQuestion()] }));

    const removeQuestion = (index: number) => {
        if (form.questions.length === 1) return;
        setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...form,
            lesson_id: form.lesson_id === '' ? null : form.lesson_id,
            questions: form.questions.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: Number(q.correctAnswer)
            }))
        };

        try {
            if (id) {
                // @ts-ignore
                await quizService.updateQuiz(id, payload);
            } else {
                // @ts-ignore
                await quizService.createQuiz(payload);
            }
            navigate('/quizzes');
        } catch (error: any) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    console.log()
    return (
        <BaseLayout>
            <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{id ? 'Edit Quiz' : 'Create New Quiz'}</h2>
                    <button type="button" onClick={() => navigate('/quizzes')} className="text-gray-600 hover:text-gray-900">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input required className="w-full border rounded px-3 py-2" placeholder="Enter quiz title e.g. Final Exam ReactJS" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Course</label>
                                <select required className="w-full border rounded px-3 py-2" value={form.course_id} onChange={handleCourseChange}>
                                    <option value="">-- Select Course --</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Lesson (Optional)</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={form.lesson_id}
                                    onChange={e => setForm({ ...form, lesson_id: e.target.value })}
                                    disabled={!form.course_id}
                                >
                                    <option value="">-- Attach to Course (Final Exam) --</option>
                                    {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time Limit (mins)</label>
                                <input type="number" className="w-full border rounded px-3 py-2" value={form.time_limit} onChange={e => setForm({ ...form, time_limit: parseInt(e.target.value) })} />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4" />
                                    <span className="font-medium">Publish Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        {form.questions.map((q, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between mb-4">
                                    <span className="font-bold text-blue-600">Question {idx + 1}</span>
                                    {form.questions.length > 1 && <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 text-sm">Remove</button>}
                                </div>
                                <input
                                    className="w-full border rounded px-3 py-2 mb-4"
                                    placeholder="Enter question text..."
                                    value={q.question}
                                    onChange={e => handleQuestionChange(idx, 'question', e.target.value)}
                                    required
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} className={`flex items-center gap-2 p-3 rounded border ${Number(q.correctAnswer) === optIdx ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name={`correct-${idx}`}
                                                checked={Number(q.correctAnswer) === optIdx}
                                                onChange={() => handleQuestionChange(idx, 'correctAnswer', optIdx)}
                                            />
                                            <input
                                                className="flex-1 bg-transparent border-none focus:ring-0"
                                                value={opt}
                                                onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                                required
                                                placeholder={`Option ${optIdx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded hover:border-blue-500">
                            + Add Question
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
                            {loading ? 'Saving...' : 'Save Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </BaseLayout>
    );
};

export default QuizFormPage;