import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import quizService from '../../services/quizService';
import { Link, useNavigate } from 'react-router-dom';

type QuizItem = {
  id: string;
  title: string;
  courseTitle: string;
  lessonTitle: string | null; // Cho phép null nếu là Quiz cấp Course
  questionsCount: number;
  timeLimit: number;
  createdAt?: string;
};

const QuizListPage: React.FC = () => {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      // Gọi API
      const res = await quizService.getQuizzes({ limit: 100 });
      const quizzes = res?.data?.quizzes ?? [];

      // 🛠 FIX: Mapping dữ liệu an toàn
      const formatted: QuizItem[] = quizzes.map((q: any) => {
        // Kiểm tra an toàn: course_id có phải object (đã populate) không?
        const courseTitle = (q.course_id && typeof q.course_id === 'object') 
            ? q.course_id.title 
            : 'Unknown Course';

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
            createdAt: q.createdAt
        };
      });

      setItems(formatted);
      setFilteredItems(formatted);
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
            </div>
            <Link to="/admin/quizzes/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm transition-colors">
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            {loading ? (
              <div className="p-10 text-center text-gray-500">
                 <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-2"></div>
                 <p>Loading quizzes...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <span className="text-4xl block mb-2">📭</span>
                No quizzes found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{item.title}</div>
                            {item.createdAt && <div className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                {item.courseTitle}
                            </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.lessonTitle ? (
                                <span className="flex items-center gap-2 text-gray-700">
                                    <span className="bg-gray-100 p-1 rounded">📄</span> 
                                    {item.lessonTitle}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-purple-700 font-medium">
                                    <span className="bg-purple-100 p-1 rounded">🎓</span> 
                                    Final Exam
                                </span>
                            )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1">❓ <strong>{item.questionsCount}</strong> Qs</span>
                                <span className="flex items-center gap-1">⏱ <strong>{item.timeLimit}</strong> min</span>
                            </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => navigate(`/admin/quizzes/${item.id}/edit`)} 
                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            disabled={deletingId === item.id}
                            className={`${deletingId === item.id ? 'text-gray-400' : 'text-red-600 hover:text-red-900'} font-semibold`}
                          >
                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default QuizListPage;