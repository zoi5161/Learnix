import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import './AdminDashboard.css'

import axios from 'axios';

const AdminDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') return null;

    // System Statistics state
    const [stats, setStats] = useState<{ users: number; courses: number; enrollments: number } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

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
                {/* Management Section */}
                <div className="my-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-8">Management</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">


                        {/* User Management */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl 
                        transition-all duration-300 hover:-translate-y-1 
                        bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                User Management
                            </h4>
                            <p className="text-gray-600 mb-6">
                                View, assign roles, lock/unlock user accounts.
                            </p>
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="w-full bg-purple-600 text-white font-medium px-5 py-2.5 
                           rounded-xl shadow hover:bg-purple-700 hover:shadow-lg 
                           transition">
                                Manage Users
                            </button>
                        </div>

                        {/* Course */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl 
                        transition-all duration-300 hover:-translate-y-1 
                        bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                Course Management
                            </h4>
                            <p className="text-gray-600 mb-6">
                                Create, edit, publish or delete courses.
                            </p>
                            <button
                                onClick={() => navigate('/courses')}
                                className="w-full bg-blue-600 text-white font-medium px-5 py-2.5 
                           rounded-xl shadow hover:bg-blue-700 hover:shadow-lg 
                           transition">
                                Manage Courses
                            </button>
                        </div>

                        {/* Quiz */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl 
                        transition-all duration-300 hover:-translate-y-1 
                        bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                Quiz Management
                            </h4>
                            <p className="text-gray-600 mb-6">
                                Create quizzes and add manual MCQ questions.
                            </p>
                            <button
                                onClick={() => navigate('/quizzes')}
                                className="w-full bg-green-600 text-white font-medium px-5 py-2.5 
                           rounded-xl shadow hover:bg-green-700 hover:shadow-lg 
                           transition">
                                Manage Quizzes
                            </button>
                            <button
                                onClick={() => navigate('/quizzes/ai-draft')}
                                className="mt-3 w-full bg-purple-600 text-white font-medium px-5 py-2.5 
                           rounded-xl shadow hover:bg-purple-700 hover:shadow-lg 
                           transition">
                                AI Quiz Generator (Draft)
                            </button>
                        </div>

                    </div>
                </div>


                {/* System Statistics */}
                <div className="my-8">
                    <h3 className="text-2xl font-bold mb-4">System Statistics</h3>
                    {statsLoading ? (
                        <div>Loading...</div>
                    ) : statsError ? (
                        <div className="text-red-500">{statsError}</div>
                    ) : stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold">{stats.users}</div>
                                <div className="text-lg mt-2">Total Users</div>
                            </div>
                            <div className="bg-green-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold">{stats.courses}</div>
                                <div className="text-lg mt-2">Total Courses</div>
                            </div>
                            <div className="bg-yellow-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold">{stats.enrollments}</div>
                                <div className="text-lg mt-2">Total Enrollments</div>
                            </div>
                        </div>
                    ) : null}
                </div>





                {/* Student Quiz Results */}
                <div className="mt-10">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                        Student Quiz Insights
                    </h3>

                    <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg shadow-sm">
                        <h4 className="text-lg font-medium text-yellow-800">
                            Recent Quiz Attempts
                        </h4>

                        <ul className="mt-3 text-gray-700 space-y-2">
                            <li>John Doe — *JavaScript Basics Quiz* — Score: 9/10</li>
                            <li>Emily Tran — *React Lesson 1 Quiz* — Score: 7/10</li>
                            <li>Adam Lee — *Design Pattern Quiz* — Score: 10/10</li>
                        </ul>
                    </div>
                </div>


                {/* Course Moderation */}
                        <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl 
                        transition-all duration-300 hover:-translate-y-1 
                        bg-gradient-to-br from-white to-gray-50">
                            <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                Course Moderation
                            </h4>
                            <p className="text-gray-600 mb-6">
                                Review and change course status (draft, pending, approved, etc).
                            </p>
                            <button
                                onClick={() => navigate('/admin/courses/moderation')}
                                className="w-full bg-orange-600 text-white font-medium px-5 py-2.5 
                           rounded-xl shadow hover:bg-orange-700 hover:shadow-lg 
                           transition">
                                Moderate Courses
                            </button>
                        </div>

            </div>
        </BaseLayout>
    );
};

export default AdminDashboard;
