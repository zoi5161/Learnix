import React, { useEffect, useState } from 'react';
import { courseService, CourseWithCounts } from '../../services/courseService';

const statusOptions = [
  'draft',
  'pending',
  'approved',
  'published',
  'rejected',
  'hidden',
];

const CourseModerationPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getCourses({ status: 'all', limit: 50 });
      setCourses(res.data.courses);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleStatusChange = async (courseId: string, status: string) => {
    setUpdating(courseId);
    try {
      await courseService.updateCourseStatus(courseId, status);
      fetchCourses();
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Course Moderation</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Instructor</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id}>
                <td className="border px-4 py-2">{c.title}</td>
                <td className="border px-4 py-2">{c.instructor_id?.name || 'N/A'}</td>
                <td className="border px-4 py-2">
                  <select
                    value={c.status}
                    disabled={updating === c._id}
                    onChange={(e) => handleStatusChange(c._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="px-3 py-1 rounded bg-blue-500 text-white"
                    disabled={updating === c._id}
                    onClick={() => handleStatusChange(c._id, c.status)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseModerationPage;
