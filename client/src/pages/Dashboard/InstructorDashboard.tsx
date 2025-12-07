import React from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';

const InstructorDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    if (!user || user.role !== 'instructor') {
        navigate('/login');
        return null;
    }

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Instructor Dashboard
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Hello, {user.name}! Manage your courses and students here.
                </p>

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
            </div>
        </BaseLayout>
    );
};

export default InstructorDashboard;
