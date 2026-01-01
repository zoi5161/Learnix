import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';
import { courseService, CourseWithCounts } from '../../services/courseService';
import './CourseModerationPage.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Only expose the statuses used in the main moderation flow
const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'published', label: 'Published', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];

const CourseModerationPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const navigate = useNavigate();

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

  const getStatusBadgeClass = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    const color = statusConfig?.color || 'gray';
    
    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    
    return colorClasses[color];
  };

  const filteredCourses = filterStatus === 'all' 
    ? courses 
    : courses.filter(c => c.status === filterStatus);

  const statusCounts = statusOptions.map((status) => ({
    ...status,
    count: courses.filter(c => c.status === status.value).length,
  }));

  const totalCoursesForChart = statusCounts.reduce((sum, status) => sum + status.count, 0);

  const pieColors: Record<string, string> = {
    draft: '#9ca3af', // gray-400
    pending: '#facc15', // yellow-400
    published: '#4ade80', // green-400
    rejected: '#f87171', // red-400
  };

  const pieBackground = (() => {
    if (!totalCoursesForChart) return '#e5e7eb'; // gray-200 fallback

    let current = 0;
    const segments: string[] = [];

    statusCounts.forEach((status) => {
      if (!status.count) return;
      const start = (current / totalCoursesForChart) * 100;
      const end = ((current + status.count) / totalCoursesForChart) * 100;
      const color = pieColors[status.value] || '#9ca3af';
      segments.push(`${color} ${start}% ${end}%`);
      current += status.count;
    });

    return `conic-gradient(${segments.join(', ')})`;
  })();

  const instructorStats = React.useMemo(() => {
    const byInstructor = new Map<string, { name: string; email: string; courseCount: number }>();

    courses.forEach((course) => {
      const id = course.instructor_id?._id || course.instructor_id?.email || course.instructor_id?.name || 'unknown';
      const name = course.instructor_id?.name || 'Unknown Instructor';
      const email = course.instructor_id?.email || '';

      const existing = byInstructor.get(id) || { name, email, courseCount: 0 };
      existing.courseCount += 1;
      byInstructor.set(id, existing);
    });

    return Array.from(byInstructor.values())
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 5);
  }, [courses]);

  const totalInstructorCourses = instructorStats.reduce(
    (sum, inst) => sum + inst.courseCount,
    0
  );

  const enrollmentStats = React.useMemo(() => {
    return courses
      .map((course) => ({
        id: course._id,
        title: course.title,
        enrollments: course.enrollmentsCount || 0,
      }))
      .filter((c) => c.enrollments > 0)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);
  }, [courses]);

  const barColors = [
    '#22C55E', // emerald
    '#16A34A', // green
    '#4ADE80', // light green
    '#0EA5E9', // sky
    '#2563EB', // blue
    '#6366F1', // indigo
    '#A855F7', // purple
    '#EC4899', // pink
    '#F97316', // orange
    '#F59E0B', // amber
    '#E11D48', // rose
    '#14B8A6', // teal
  ];

  const getBarColor = (key: string, index: number) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    const colorIndex = Math.abs(hash + index) % barColors.length;
    return barColors[colorIndex];
  };

  return (
    <BaseLayout>
      <div className="course-moderation-container">
        {/* Header Section */}
        <div className="course-moderation-header">
          <div className="course-moderation-header-content">
            <div className="course-moderation-header-left">
              <button className="course-moderation-back-btn" onClick={() => navigate('/dashboard')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <div className="course-moderation-header-text">
                <h1>📚 Course Moderation</h1>
                <p>Review and manage course status</p>
              </div>
            </div>
            <div className="course-moderation-stats">
              <p>Total Courses</p>
              <p>{courses.length}</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="course-moderation-filter">
          <div className="course-moderation-filter-content">
            <span className="course-moderation-filter-label">Filter by Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`course-moderation-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            >
              All ({courses.length})
            </button>
            {statusOptions.map((status) => {
              const count = courses.filter(c => c.status === status.value).length;
              return (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`course-moderation-filter-btn ${filterStatus === status.value ? 'active' : ''}`}
                >
                  {status.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="course-moderation-content">
          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading courses...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ background: '#fee2e2', borderLeft: '4px solid #dc2626', padding: '16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                <svg style={{ width: '24px', height: '24px', color: '#dc2626', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: '#991b1b', fontWeight: 500 }}>{error}</p>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <svg style={{ margin: '0 auto', height: '48px', width: '48px', color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>No courses found</h3>
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>No courses match the selected filter.</p>
            </div>
          ) : (
            <div className="course-moderation-table-wrapper">
              <table className="course-moderation-table">
                <thead>
                  <tr>
                    <th>Course Info</th>
                    <th>Instructor</th>
                    <th>Stats</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="course-info-cell">
                          <div className="course-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="course-info-text">
                            <h3 title={c.title}>{c.title}</h3>
                            <p>ID: {c._id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="instructor-cell">
                          <div className="instructor-avatar">
                            {c.instructor_id?.name?.charAt(0).toUpperCase() || 'N'}
                          </div>
                          <div className="instructor-info">
                            <h4>{c.instructor_id?.name || 'N/A'}</h4>
                            <p>{c.instructor_id?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="course-stats">
                          <div className="course-stat-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{c.enrollmentsCount || 0} students</span>
                          </div>
                          <div className="course-stat-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{c.lessonsCount || 0} lessons</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`course-status-badge ${getStatusBadgeClass(c.status)}`}>
                          {statusOptions.find(s => s.value === c.status)?.label || c.status}
                        </span>
                      </td>
                      <td>
                        <div className="course-actions">
                          <button className="course-view-btn" onClick={() => navigate(`/courses/${c._id}`)}>
                            👁️ View
                          </button>
                          <select
                            value={c.status}
                            disabled={updating === c._id}
                            onChange={(e) => handleStatusChange(c._id, e.target.value)}
                            className="course-status-select"
                            aria-label={`Change status for ${c.title}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        {updating === c._id && (
                          <div className="course-updating">
                            <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Updating...</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {/* {!loading && !error && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statusCounts.map((status) => (
              <div key={status.value} className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">{status.label}</p>
                <p className={`text-2xl font-bold text-${status.color}-600`}>{status.count}</p>
              </div>
            ))}
          </div>
        )} */}

        {/* Status Distribution Chart */}
        {!loading && !error && courses.length > 0 && (
          <div className="course-chart-section">
            <h2 className="course-chart-title">📊 Biểu đồ trạng thái khóa học</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex justify-center md:w-1/2">
                <div
                  className="relative w-48 h-48 md:w-56 md:h-56 rounded-full shadow-inner"
                  style={{ backgroundImage: pieBackground }}
                >
                  <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-500">Tổng</span>
                    <span className="text-2xl font-bold text-gray-800">{totalCoursesForChart}</span>
                    <span className="text-xs text-gray-400">khóa học</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {statusCounts.map((status) => {
                  const percent = totalCoursesForChart
                    ? Math.round((status.count / totalCoursesForChart) * 100)
                    : 0;

                  return (
                    <div key={status.value} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: pieColors[status.value] || '#9ca3af' }}
                        />
                        <span className="font-medium text-gray-700">{status.label}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">{percent}%</span>
                        <span className="text-xs text-gray-400 ml-2">({status.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Instructors by Courses (Pie Chart) */}
        {!loading && !error && instructorStats.length > 0 && (
          <div className="course-chart-section">
            <h2 className="course-chart-title">👨‍🏫 Biểu đồ số khoá học của từng giảng viên</h2>
            <p className="course-chart-subtitle">
              Phân bố số khóa học giữa các giảng viên trong danh sách này.
            </p>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex justify-center md:w-1/2">
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                  <div
                    className="absolute inset-0 rounded-full shadow-inner"
                    style={{
                      backgroundImage: (() => {
                        if (!totalInstructorCourses) return '#e5e7eb';
                        let current = 0;
                        const segments: string[] = [];
                        const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];
                        instructorStats.forEach((inst, index) => {
                          if (!inst.courseCount) return;
                          const start = (current / totalInstructorCourses) * 100;
                          const end = ((current + inst.courseCount) / totalInstructorCourses) * 100;
                          const color = colors[index % colors.length];
                          segments.push(`${color} ${start}% ${end}%`);
                          current += inst.courseCount;
                        });
                        return `conic-gradient(${segments.join(', ')})`;
                      })(),
                    }}
                  />
                  <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-gray-500">Tổng khóa học</span>
                    <span className="text-lg font-bold text-gray-800">
                      {totalInstructorCourses}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                {instructorStats.map((inst, index) => {
                  const percent = totalInstructorCourses
                    ? Math.round((inst.courseCount / totalInstructorCourses) * 100)
                    : 0;
                  const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];
                  const color = colors[index % colors.length];

                  return (
                    <div key={inst.name + inst.email} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 truncate max-w-[150px]">
                            {inst.name}
                          </span>
                          {inst.email && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                              {inst.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-gray-600">
                        <span className="font-semibold mr-1">{percent}%</span>
                        <span className="text-[10px] text-gray-400">
                          ({inst.courseCount})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Courses by Enrollments (Bar Chart - Recharts) */}
        {!loading && !error && enrollmentStats.length > 0 && (
          <div className="course-chart-section">
            <h2 className="course-chart-title">📈 Biểu đồ tham gia các khoá học</h2>
            <p className="course-chart-subtitle">
              So sánh lượt ghi danh giữa các khóa học phổ biến.
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enrollmentStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="title"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    tickFormatter={(value: string) =>
                      value.length > 14 ? `${value.slice(0, 14)}...` : value
                    }
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [`${value ?? 0} lượt ghi danh`, 'Lượt ghi danh']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="enrollments" radius={[8, 8, 0, 0]} barSize={40}>
                    {enrollmentStats.map((course, index) => {
                      const color = getBarColor(course.id, index);
                      return <Cell key={course.id} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default CourseModerationPage;
