import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import quizService from '../../services/quizService';
import api from '../../services/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';

type QuizItem = {
  id: string;
  title: string;
  courseTitle: string;
  lessonTitle: string | null; // Cho phép null nếu là Quiz cấp Course
  questionsCount: number;
  timeLimit: number;
  createdAt?: string;
  instructorId?: string;
  courseId?: string;
};

type CourseItem = {
  _id: string;
  title: string;
  instructor_id?: string | { _id?: string; id?: string };
};

const QuizListPage: React.FC = () => {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseOwners, setCourseOwners] = useState<Record<string, string>>({});

  const user = getUserFromToken();

  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = items.filter(
      item => 
        item.title.toLowerCase().includes(lowerTerm) || 
        item.courseTitle.toLowerCase().includes(lowerTerm) ||
        (item.lessonTitle && item.lessonTitle.toLowerCase().includes(lowerTerm))
    );
    setFilteredItems(results);
  }, [searchTerm, items]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      // Gọi API: lấy quiz + course để biết instructor
      const [quizRes, courseRes] = await Promise.all([
        quizService.getQuizzes({ limit: 200 }),
        api.get('/courses', { params: { status: 'all', limit: 500 } })
      ]);

      const quizzes = quizRes?.data?.data?.quizzes
        ?? quizRes?.data?.quizzes
        ?? quizRes?.quizzes
        ?? [];
      const courses: CourseItem[] = courseRes?.data?.data?.courses ?? [];

      const ownerMap: Record<string, string> = {};
      const ownedCourseIds = new Set<string>();
      courses.forEach((c) => {
        const instructorRaw = typeof c.instructor_id === 'object'
          ? c.instructor_id?._id || c.instructor_id?.id
          : c.instructor_id;
        const instructor = instructorRaw ? String(instructorRaw) : '';
        const courseKey = c._id ? String(c._id) : '';
        if (courseKey && instructor) {
          ownerMap[courseKey] = instructor;
          if (user?.role === 'instructor' && instructor === user.userId) {
            ownedCourseIds.add(courseKey);
          }
        }
      });
      setCourseOwners(ownerMap);

      // 🛠 FIX: Mapping dữ liệu an toàn
      const formatted: QuizItem[] = quizzes.map((q: any) => {
        // Kiểm tra an toàn: course_id có phải object (đã populate) không?
        const courseObj = q.course_id && typeof q.course_id === 'object' ? q.course_id : null;
        const courseTitle = courseObj ? courseObj.title : 'Unknown Course';

        const courseIdRaw = courseObj ? courseObj._id : q.course_id;
        const courseKey = courseIdRaw ? String(courseIdRaw) : '';
        const instructorIdFromCourse = courseKey ? ownerMap[courseKey] : undefined;

        // Lấy instructorId từ course đã populate (nếu có)
        const instructorId = courseObj
          ? (typeof courseObj.instructor_id === 'object'
            ? String(courseObj.instructor_id?._id || courseObj.instructor_id?.id || '')
            : String(courseObj.instructor_id || ''))
          : instructorIdFromCourse;

        // Kiểm tra an toàn: lesson_id có phải object không?
        const lessonTitle = (q.lesson_id && typeof q.lesson_id === 'object') 
            ? q.lesson_id.title 
            : null;

        return {
            id: q._id || q.id,
            title: q.title,
            courseTitle: courseTitle,
            lessonTitle: lessonTitle,
            questionsCount: q.questionsCount || 0, // Backend mới đã trả về field này
            timeLimit: q.time_limit || 0,
            createdAt: q.createdAt,
            instructorId,
            courseId: courseKey
        };
      });

      const ownedOnly = user?.role === 'instructor'
        ? formatted.filter(item => item.courseId && ownedCourseIds.has(item.courseId))
        : formatted;

      setItems(ownedOnly);
      setFilteredItems(ownedOnly);
    } catch (err) {
      console.error('Load quizzes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    setDeletingId(id);
    try {
      await quizService.deleteQuiz(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => navigate('/dashboard')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
            </div>
            <Link to="/quizzes/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm transition-colors">
              + Create New Quiz
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search by quiz title, course, or lesson..."
              className="block w-full rounded-md border-gray-300 p-3 pl-10 border shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>

          {/* Table */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredItems.map((item) => (
    <div
      key={item.id}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col hover:shadow-md transition"
    >
      {/* QUIZ TITLE (2 lines fixed height) */}
      <h3
        title={item.title}
        className="
          text-lg font-semibold text-gray-900 leading-snug 
          line-clamp-2
        "
        style={{ minHeight: "3.2rem" }}
      >
        {item.title}
      </h3>

      {/* DATE */}
      {item.createdAt && (
        <p className="text-xs text-gray-400 mt-1">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>
      )}

      {/* COURSE (only 1 line, always truncate) */}
      <div className="mt-4">
        <span
          className="
            inline-block px-3 py-1 text-xs font-semibold rounded-full 
            bg-blue-100 text-blue-800 border border-blue-200 
            max-w-full truncate
          "
          title={item.courseTitle}
        >
          {item.courseTitle}
        </span>
      </div>

      {/* CONTEXT */}
      <div className="mt-4">
        {item.lessonTitle ? (
          <div
            className="
              flex items-center gap-2 text-gray-700 text-sm 
              bg-gray-50 border border-gray-200 
              p-2 rounded-lg overflow-hidden
            "
          >
            <span className="text-lg">📄</span>
            <span className="truncate">{item.lessonTitle}</span>
          </div>
        ) : (
          <div
            className="
              flex items-center gap-2 text-purple-700 bg-purple-50 
              border border-purple-200 p-2 rounded-lg 
              text-sm font-medium
            "
          >
            <span className="text-lg">🎓</span>
            <span>Final Exam</span>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="mt-4 flex gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          ❓ <strong>{item.questionsCount}</strong> Qs
        </div>
        <div className="flex items-center gap-1">
          ⏱ <strong>{item.timeLimit}</strong> min
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex justify-end gap-4 text-sm font-medium">
        <button
          onClick={() => navigate(`/quizzes/${item.id}/edit`)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </button>

        <button
          onClick={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
          className={`${
            deletingId === item.id
              ? "text-gray-400"
              : "text-red-600 hover:text-red-900"
          }`}
        >
          {deletingId === item.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  ))}
</div>

        </div>
      </div>
    </BaseLayout>
  );
};

export default QuizListPage;