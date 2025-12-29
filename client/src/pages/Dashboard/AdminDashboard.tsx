import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import axios from 'axios';
import './AdminDashboard.css';

// Thêm các thành phần từ Recharts
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const AdminDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    // System Statistics state
    const [stats, setStats] = useState<{ users: number; courses: number; enrollments: number } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            setStatsError(null);
            try {
                const token = localStorage.getItem('accessToken');
                const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                const res = await axios.get(`${apiBase}/user/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(res.data);
            } catch {
                setStatsError('Failed to fetch statistics');
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (!user || user.role !== 'admin') return null;

    // Chuẩn bị dữ liệu cho Chart
    const chartData = stats ? [
        { name: 'Users', count: stats.users, color: '#3B82F6' },       // Blue
        { name: 'Courses', count: stats.courses, color: '#10B981' },   // Green
        { name: 'Enrollments', count: stats.enrollments, color: '#F59E0B' } // Yellow
    ] : [];

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">

                {/* Header */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Admin Dashboard
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Welcome, {user.name}! Manage courses, lessons, quizzes, and track student performance.
                </p>

                {/* System Statistics */}
                <div className="my-8">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">System Statistics</h3>
                    {statsLoading ? (
                        <div className="text-center py-10 text-gray-500">Loading statistics...</div>
                    ) : statsError ? (
                        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">{statsError}</div>
                    ) : stats ? (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center shadow-sm">
                                    <div className="text-4xl font-bold text-blue-600">{stats.users}</div>
                                    <div className="text-gray-600 font-medium mt-1">Total Users</div>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center shadow-sm">
                                    <div className="text-4xl font-bold text-green-600">{stats.courses}</div>
                                    <div className="text-gray-600 font-medium mt-1">Total Courses</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center shadow-sm">
                                    <div className="text-4xl font-bold text-yellow-600">{stats.enrollments}</div>
                                    <div className="text-gray-600 font-medium mt-1">Total Enrollments</div>
                                </div>
                            </div>

                            {/* Chart Visualization */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner h-[350px]">
                                <h4 className="text-lg font-semibold text-gray-700 mb-6 text-center">Data Visualization</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6B7280', fontSize: 14 }}
                                            dy={10}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={60}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Management Section */}
                <div className="my-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-8">Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* User Management */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">User Management</h4>
                            <p className="text-gray-600 mb-6">View, assign roles, lock/unlock user accounts.</p>
                            <button onClick={() => navigate('/admin/users')} className="w-full bg-purple-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-purple-700 transition">
                                Manage Users
                            </button>
                        </div>

                        {/* Course Management */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">Course Management</h4>
                            <p className="text-gray-600 mb-6">Create, edit, publish or delete courses.</p>
                            <button onClick={() => navigate('/courses')} className="w-full bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition">
                                Manage Courses
                            </button>
                        </div>

                        {/* Quiz Management */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">Quiz Management</h4>
                            <p className="text-gray-600 mb-6">Create quizzes and add manual MCQ questions.</p>
                            <button onClick={() => navigate('/quizzes')} className="w-full bg-green-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-green-700 transition">
                                Manage Quizzes
                            </button>
                            <button onClick={() => navigate('/quizzes/ai-draft')} className="mt-3 w-full bg-purple-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-purple-700 transition">
                                AI Quiz Generator (Draft)
                            </button>
                        </div>

                        {/* Course Moderation */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">Course Moderation</h4>
                            <p className="text-gray-600 mb-6">Review and change course status (draft, pending, approved, etc).</p>
                            <button onClick={() => navigate('/admin/courses/moderation')} className="w-full bg-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow hover:bg-orange-700 transition">
                                Moderate Courses
                            </button>
                        </div>
                    </div>
                </div>

                {/* Student Quiz Results */}
                <div className="mt-10 border-t pt-10">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                        Student Quiz Insights
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-medium text-yellow-800">Recent Quiz Attempts</h4>
                        <ul className="mt-3 text-gray-700 space-y-2">
                            <li>John Doe — <i>JavaScript Basics Quiz</i> — Score: 9/10</li>
                            <li>Emily Tran — <i>React Lesson 1 Quiz</i> — Score: 7/10</li>
                            <li>Adam Lee — <i>Design Pattern Quiz</i> — Score: 10/10</li>
                        </ul>
                    </div>
                </div>

            </div>
        </BaseLayout>
    );
};

export default AdminDashboard;