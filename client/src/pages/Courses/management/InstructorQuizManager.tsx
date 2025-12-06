import React, { useState, useEffect } from 'react';
import BaseLayout from '../../../layouts/BaseLayout';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { quizService, QuizCreateData, QuestionData, QuestionOption } from '../../../services/quizService';

// Định nghĩa lại type cho dữ liệu Quiz đầy đủ
interface FullQuizData extends QuizCreateData {
    _id: string;
    lesson_id: string;
}

// Hàm tìm index của đáp án đúng
const correctOptionIndex = (options: QuestionOption[]): number => {
    return options.findIndex(opt => opt.is_correct);
};

const InstructorQuizManager: React.FC = () => {
    const navigate = useNavigate();
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>(); 

    // --- State Logic ---
    const [quizId, setQuizId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // --- State Dữ liệu ---
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState(0);
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    
    // --- State UI ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- EFFECT: TẢI DỮ LIỆU QUIZ ĐÃ TẠO (VIEW/EDIT MODE) ---
    useEffect(() => {
        if (!lessonId || !courseId) {
            setError("Thiếu ID Bài học hoặc Khóa học.");
            setLoading(false);
            return;
        }

        const fetchQuizData = async () => {
            try {
                const result = await quizService.getQuizForInstructor(courseId, lessonId); 
                
                if (result.quiz && result.questions && result.quiz._id) {
                    setIsEditMode(true);
                    setQuizId(result.quiz._id);
                    setQuizTitle(result.quiz.title || '');
                    setQuizDescription(result.quiz.description || '');
                    setTimeLimit(result.quiz.time_limit || 0);

                    // Gán Questions vào state
                    setQuestions(result.questions);
                } else {
                    setIsEditMode(false);
                }
            } catch (err: any) {
                // Nếu lỗi 404 (Quiz not found), cho phép tạo mới
                if (err.response?.status === 404) {
                     setIsEditMode(false);
                     setError(null);
                } else {
                    console.error("Lỗi tải Quiz:", err);
                    setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu Quiz.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [courseId, lessonId]);


    // --- HÀM XỬ LÝ DỮ LIỆU ---
    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                _id: undefined, // Cho biết đây là câu hỏi mới cần insert
                question_text: '',
                question_type: 'multiple_choice',
                points: 1,
                options: [
                    { text: '', is_correct: true }, 
                    { text: '', is_correct: false }, 
                    { text: '', is_correct: false },
                    { text: '', is_correct: false },
                ],
                correct_answer: ''
            } as QuestionData,
        ]);
    };

    const removeQuestion = (qIndex: number) => {
        setQuestions(questions.filter((_, idx) => idx !== qIndex));
    };

    const handleQuestionChange = (index: number, field: keyof QuestionData, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options![oIndex].text = text;
        setQuestions(newQuestions);
    };

    const handleCorrectOptionChange = (qIndex: number, correctOIndex: number) => {
        const newQuestions = [...questions];
        
        newQuestions[qIndex].options = newQuestions[qIndex].options!.map((opt, idx) => ({
            ...opt,
            is_correct: idx === correctOIndex,
        }));
        
        newQuestions[qIndex].correct_answer = newQuestions[qIndex].options![correctOIndex].text;
        
        setQuestions(newQuestions);
    };

    // --- HÀM SUBMIT CHUNG (CREATE VÀ UPDATE) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lessonId || !courseId || questions.length === 0) {
            setError("Vui lòng nhập đủ thông tin và ít nhất một câu hỏi.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const quizData: QuizCreateData = {
                lesson_id: lessonId,
                title: quizTitle,
                description: quizDescription,
                time_limit: timeLimit,
                attempts_allowed: 3, 
                passing_score: 70,
                // Loại bỏ thuộc tính 'options' khỏi các câu hỏi nếu BE không cần nó (đã xử lý logic đáp án đúng)
                questions: questions.map(q => {
                    const { options, ...rest } = q;
                    return rest;
                }),
                ...(isEditMode && quizId && { _id: quizId }), 
            };

            if (isEditMode) {
                await quizService.updateQuiz(courseId, quizData); 
                alert('Quiz đã được CẬP NHẬT thành công!');
            } else {
                await quizService.createQuiz(courseId, quizData); 
                alert('Quiz đã được TẠO thành công và được gắn vào bài học!');
            }
            
            // SỬ DỤNG QUERY PARAMETER ĐỂ BUỘC COMPONENT LESSONMANAGER TẢI LẠI DỮ LIỆU
            const timestamp = new Date().getTime();
            navigate(`/instructor/courses/${courseId}/lessons?reload=${timestamp}`, { 
                replace: true 
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi lưu Quiz.');
        } finally {
            setLoading(false);
        }
    };
    
    // --- PHẦN RENDER ---
    if (loading) {
        return <BaseLayout><div className="p-6 text-center text-gray-600">Đang tải dữ liệu Quiz...</div></BaseLayout>;
    }
    
    return (
        <BaseLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <Link to={`/instructor/courses/${courseId}/lessons`} className="text-blue-600 hover:underline mb-4 block">
                    &larr; Trở lại Quản lý Bài học
                </Link>
                <h1 className="text-3xl font-bold mb-6 border-b pb-2">
                    {isEditMode ? 'Chỉnh Sửa Bài Quiz' : 'Tạo Bài Quiz Mới'}
                </h1>
                
                {error && (
                    <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Phần Thông tin Quiz */}
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-xl font-semibold">Thông tin chung</h2>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Tiêu đề Quiz</label>
                            <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Mô tả</label>
                            <textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} rows={2} className="shadow appearance-none border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Giới hạn thời gian (phút)</label>
                            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} min={0} className="shadow appearance-none border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500"/>
                        </div>
                    </div>

                    {/* Phần Câu hỏi (MCQ) */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">Câu hỏi ({questions.length})</h2>
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                                <h3 className="font-bold mb-3 text-lg">Câu hỏi {qIndex + 1} (ID: {q._id || 'Mới'})</h3>
                                
                                {/* Nút Xóa */}
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                                    aria-label="Remove question"
                                >
                                    ❌
                                </button>
                                
                                {/* Text Câu hỏi */}
                                <div>
                                    <label className="block text-gray-700 text-sm mb-1">Nội dung Câu hỏi</label>
                                    <textarea value={q.question_text} onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)} required rows={2} className="shadow appearance-none border rounded w-full py-2 px-3 focus:ring-2 focus:ring-blue-500"/>
                                </div>
                                
                                {/* Options (Trắc nghiệm) */}
                                <div className="mt-3 space-y-2">
                                    <p className="text-gray-700 text-sm font-medium">Các Lựa chọn:</p>
                                    {q.options?.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center space-x-2">
                                            <input 
                                                type="radio" 
                                                name={`q-${qIndex}-correct`} 
                                                checked={correctOptionIndex(q.options!) === oIndex}
                                                onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                                                className="form-radio text-green-600"
                                            />
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                required
                                                placeholder={`Option ${oIndex + 1}`}
                                                className="shadow border rounded w-full py-1 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Điểm */}
                                <div className="mt-3">
                                    <label className="block text-gray-700 text-sm mb-1">Điểm</label>
                                    <input type="number" value={q.points} onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)} min={1} className="shadow border rounded py-1 px-3 w-20"/>
                                </div>

                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full mt-4">
                            + Thêm Câu hỏi
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || questions.length === 0}
                        className={`w-full text-white font-bold py-3 rounded-lg transition duration-300 ${
                            loading || questions.length === 0
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {loading 
                            ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo Quiz...') 
                            : (isEditMode ? 'Lưu Thay Đổi Quiz' : 'Tạo Quiz Mới')
                        }
                    </button>
                </form>
            </div>
        </BaseLayout>
    );
};

export default InstructorQuizManager;