import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import api from '../../services/axiosInstance';

interface MCQItem {
  question: string;
  options: string[];
  answer: number;
}

interface Course {
  _id: string;
  title: string;
}

interface Lesson {
  _id: string;
  title: string;
}

const AIQuizDraftPage: React.FC = () => {
  const user = getUserFromToken();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('AI Generated Quiz');
  const [courseId, setCourseId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await api.get('/courses');
        const coursesList = res.data?.data?.courses || [];
        setCourses(coursesList);
      } catch (e) {
        console.error('Failed to fetch courses', e);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch lessons when course changes
  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setLessonId('');
      return;
    }
    const fetchLessons = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/lessons/manage/all`);
        // Response structure: { success: true, data: [...] }
        const lessonsList = Array.isArray(res.data?.data) ? res.data.data : [];
        setLessons(lessonsList);
      } catch (e) {
        console.error('Failed to fetch lessons', e);
        setLessons([]);
      }
    };
    fetchLessons();
  }, [courseId]);

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <BaseLayout>
        <div className="p-6">
          <p>Redirecting to login...</p>
        </div>
      </BaseLayout>
    );
  }

  const generateMcq = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/quizzes/generate-mcq', { text: inputText });
      const data = res.data?.mcqs || [];
      // normalize to ensure 4 options
      const normalized = data.map((q: MCQItem) => ({
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
        answer: typeof q.answer === 'number' ? q.answer : 0,
      }));
      setMcqs(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to generate MCQs');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (idx: number, field: 'question' | 'answer', value: string | number) => {
    setMcqs(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setMcqs(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const removeQuestion = (idx: number) => {
    setMcqs(prev => prev.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    setMcqs(prev => ([...prev, { question: '', options: ['', '', '', ''], answer: 0 }]));
  };

  const approveAndSave = async () => {
    setError(null);
    // basic validation
    if (!title.trim() || !courseId || !lessonId) {
      setError('Please provide title, course and lesson');
      return;
    }
    if (mcqs.length < 5) {
      setError('Please keep at least 5 questions');
      return;
    }
    const payload = {
      title,
      course_id: courseId,
      lesson_id: lessonId,
      description: 'AI generated quiz',
      time_limit: 0,
      questions: mcqs.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
      })),
    };
    try {
      const res = await api.post('/quizzes', payload);
      const quizId = res.data?.data?._id || res.data?.data?.id;
      navigate(`/quizzes`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save quiz');
    }
  };

  return (
    <BaseLayout>
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">AI Quiz Generator (Draft)</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium">Lesson text / Course summary</label>
          <textarea className="mt-1 w-full border rounded p-2" rows={6}
            value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={generateMcq} disabled={loading}>
            {loading ? 'Generating...' : 'Generate MCQs'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Quiz Title</label>
            <input className="mt-1 w-full border rounded p-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Course *</label>
            <select className="mt-1 w-full border rounded p-2" value={courseId} onChange={(e)=>setCourseId(e.target.value)} disabled={loadingCourses}>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Lesson *</label>
            <select className="mt-1 w-full border rounded p-2" value={lessonId} onChange={(e)=>setLessonId(e.target.value)} disabled={!courseId || lessons.length === 0}>
              <option value="">-- Select Lesson --</option>
              {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="text-red-600 mb-3">{error}</div>}

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Preview & Edit MCQs</h2>
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={addQuestion}>Add Question</button>
        </div>

        <div className="space-y-6">
          {mcqs.map((q, idx) => (
            <div key={idx} className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Question #{idx+1}</span>
                <button className="text-red-600" onClick={() => removeQuestion(idx)}>Remove</button>
              </div>
              <input className="w-full border rounded p-2 mb-3" value={q.question}
                     onChange={(e)=>updateQuestion(idx,'question', e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, oIdx) => (
                  <input key={oIdx} className="border rounded p-2" value={opt}
                         onChange={(e)=>updateOption(idx, oIdx, e.target.value)} placeholder={`Option ${oIdx+1}`} />
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium">Correct Answer (index 0-3)</label>
                <input type="number" min={0} max={3} className="border rounded p-2"
                       value={q.answer} onChange={(e)=>updateQuestion(idx,'answer', Number(e.target.value))} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button className="px-5 py-2 bg-purple-600 text-white rounded" onClick={approveAndSave}>
            Approve & Save Quiz
          </button>
        </div>
      </div>
    </BaseLayout>
  );
};

export default AIQuizDraftPage;