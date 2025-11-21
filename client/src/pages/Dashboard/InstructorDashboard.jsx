import React from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';

const InstructorDashboard = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    if (!user || user.role !== 'instructor') {
        navigate('/login');
        return null;
    }

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">Instructor Dashboard</h1>
                <p className="text-lg text-gray-600 mb-6">Hello, {user.name}! Manage your courses and students here.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700">My Courses</h3>
                        <p className="text-3xl font-bold mt-2">5 Active</p>
                        <button className="mt-3 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Create New Course</button>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-pink-700">Student Enrollment</h3>
                        <p className="text-3xl font-bold mt-2">150 Total Students</p>
                        <button className="mt-3 bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700">View Analytics</button>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};

export default InstructorDashboard;