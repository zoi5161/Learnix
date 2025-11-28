import React from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';

const AdminDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    if (!user || user.role !== 'admin') {
        navigate('/login');
        return null;
    }

    return (
        <BaseLayout>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">
                    Admin Dashboard
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Welcome, {user.name}! You have full control over the system.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-blue-700">Total Users</h3>
                        <p className="text-3xl font-bold mt-2">1,250</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-yellow-700">Total Courses</h3>
                        <p className="text-3xl font-bold mt-2">45</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-green-700">
                            Courses Pending Approval
                        </h3>
                        <p className="text-3xl font-bold mt-2">3</p>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="flex space-x-4">
                        <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Manage Users
                        </button>
                        <button className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition">
                            Review Content
                        </button>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};

export default AdminDashboard;
