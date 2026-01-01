import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import axios from 'axios';

const InstructorDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    // Statistics state
    const [stats, setStats] = useState<{ courses: number; enrollments: number; averageQuizScore: number } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'instructor') {
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
                const res = await axios.get(`${apiBase}/instructor/stats`, {
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

    if (!user || user.role !== 'instructor') return null;

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Instructor Dashboard
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Hello, {user.name}! Manage your courses and students here.
                </p>

                {/* Statistics */}
                <div className="my-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Statistics</h3>
                    {statsLoading ? (
                        <div className="text-gray-500">Loading statistics...</div>
                    ) : statsError ? (
                        <div className="text-red-500">{statsError}</div>
                    ) : stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-blue-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-blue-700">{stats.courses}</div>
                                <div className="text-lg mt-2 text-gray-700">Created Courses</div>
                            </div>
                            <div className="bg-green-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-green-700">{stats.enrollments}</div>
                                <div className="text-lg mt-2 text-gray-700">Student Enrollments</div>
                            </div>
                            <div className="bg-yellow-100 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-yellow-700">
                                    {stats.averageQuizScore > 0 ? stats.averageQuizScore.toFixed(1) : '0'}%
                                </div>
                                <div className="text-lg mt-2 text-gray-700">Average Quiz Score</div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Management */}
                <div className="my-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-8">Management</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            </div>
        </BaseLayout>
    );
};

export default InstructorDashboard;
