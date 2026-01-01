import React, { useState, useEffect } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import api from '../../services/axiosInstance';
import './AIQuizDraftPage.css';

interface MCQItem {
  question: string;
  options: string[];
  answer: number;
}

interface Course {
  _id: string;
  title: string;
  instructor_id?: string | { _id?: string; id?: string };
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
        const filteredByOwner = coursesList.filter((course: Course) => {
          if (user?.role === 'admin') return true; // Admins can see all courses
          const instructorId = typeof course.instructor_id === 'object'
            ? course.instructor_id?._id || course.instructor_id?.id
            : course.instructor_id;
          return instructorId === user?.userId;
        });
        setCourses(filteredByOwner);
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
      <div className="ai-quiz-container">
        {/* Header */}
        <div className="ai-quiz-header">
          <h1>🤖 AI Quiz Generator</h1>
          <p>Generate quiz questions automatically using AI from your lesson content</p>
        </div>

        {/* Input Section */}
        <div className="ai-quiz-section">
          <div className="ai-quiz-section-title">
            <span>📝</span>
            <span>Step 1: Enter your content</span>
          </div>
          <label className="ai-quiz-label">Lesson text / Course summary</label>
          <textarea 
            className="ai-quiz-textarea" 
            rows={6}
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your lesson content or course summary here..."
          />
          <div style={{ marginTop: '16px' }}>
            <button className="ai-quiz-btn ai-quiz-btn-primary" onClick={generateMcq} disabled={loading}>
              {loading ? '⏳ Generating...' : '✨ Generate MCQs'}
            </button>
          </div>
        </div>

        {/* Quiz Metadata Section */}
        <div className="ai-quiz-section">
          <div className="ai-quiz-section-title">
            <span>⚙️</span>
            <span>Step 2: Configure quiz details</span>
          </div>
          <div className="ai-quiz-grid-3">
            <div>
              <label htmlFor="quiz-title" className="ai-quiz-label">Quiz Title</label>
              <input 
                id="quiz-title"
                className="ai-quiz-input" 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <label htmlFor="quiz-course" className="ai-quiz-label">Course *</label>
              <select 
                id="quiz-course"
                className="ai-quiz-select" 
                value={courseId} 
                onChange={(e)=>setCourseId(e.target.value)} 
                disabled={loadingCourses}
              >
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="quiz-lesson" className="ai-quiz-label">Lesson *</label>
              <select 
                id="quiz-lesson"
                className="ai-quiz-select" 
                value={lessonId} 
                onChange={(e)=>setLessonId(e.target.value)} 
                disabled={!courseId || lessons.length === 0}
              >
                <option value="">-- Select Lesson --</option>
                {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="ai-quiz-error">⚠️ {error}</div>}

        {/* Questions Section */}
        {mcqs.length > 0 && (
          <div className="ai-quiz-section">
            <div className="ai-quiz-header-actions">
              <h2>📋 Preview & Edit MCQs ({mcqs.length})</h2>
              <button className="ai-quiz-btn ai-quiz-btn-success" onClick={addQuestion}>
                + Add Question
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mcqs.map((q, idx) => (
                <div key={idx} className="ai-quiz-question-card">
                  <div className="ai-quiz-question-header">
                    <span className="ai-quiz-question-number">Question #{idx+1}</span>
                    <button className="ai-quiz-btn-remove" onClick={() => removeQuestion(idx)}>
                      🗑️ Remove
                    </button>
                  </div>
                  <input 
                    className="ai-quiz-input" 
                    style={{ marginBottom: '12px' }}
                    value={q.question}
                    onChange={(e)=>updateQuestion(idx,'question', e.target.value)}
                    placeholder="Enter your question"
                    aria-label={`Question ${idx+1} text`}
                  />
                  <div className="ai-quiz-grid-2">
                    {q.options.map((opt, oIdx) => (
                      <input 
                        key={oIdx} 
                        className="ai-quiz-input" 
                        value={opt}
                        onChange={(e)=>updateOption(idx, oIdx, e.target.value)} 
                        placeholder={`Option ${oIdx+1}`}
                        aria-label={`Question ${idx+1} option ${oIdx+1}`}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label htmlFor={`question-${idx}-answer`} className="ai-quiz-label">Correct Answer (index 0-3)</label>
                    <input 
                      id={`question-${idx}-answer`}
                      type="number" 
                      min={0} 
                      max={3} 
                      className="ai-quiz-input"
                      style={{ width: '120px' }}
                      value={q.answer} 
                      onChange={(e)=>updateQuestion(idx,'answer', Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-quiz-footer">
              <button className="ai-quiz-btn ai-quiz-btn-purple" onClick={approveAndSave}>
                💾 Approve & Save Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default AIQuizDraftPage;