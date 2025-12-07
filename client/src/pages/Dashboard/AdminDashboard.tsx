import React, { useEffect } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import './AdminDashboard.css'

const AdminDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') return null;

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">

                {/* Header */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Admin Instructor Dashboard
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Welcome, {user.name}! Manage courses, lessons, quizzes, and track student performance.
                </p>
                {/* Management Section */}
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
                        </div>

                    </div>
                </div>


                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-label">Total Courses</div>
                        <div className="stat-value">45</div>
                        <div className="stat-sub">+5% this month</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Total Lessons</div>
                        <div className="stat-value">320</div>
                        <div className="stat-sub">+18 new lessons</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Student Avg Quiz Score</div>
                        <div className="stat-value">82%</div>
                        <div className="stat-sub">Stable from last week</div>
                    </div>
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

            </div>
        </BaseLayout>
    );
};

export default AdminDashboard;
