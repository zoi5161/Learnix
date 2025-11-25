import React, { useEffect, useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import userService from '../../services/userService';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        userService
            .getProfile()
            .then(setUser)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <BaseLayout>Đang tải...</BaseLayout>;
    if (!user) return <BaseLayout>Không thể lấy thông tin user</BaseLayout>;

    return (
        <BaseLayout>
            <div className="max-w-2xl mx-auto mt-10">
                <h1 className="text-3xl font-extrabold mb-6 text-gray-800">Thông tin cá nhân</h1>
                <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                    <div className="mb-4">
                        <p className="text-gray-500 text-sm font-semibold">Họ và tên</p>
                        <p className="text-gray-900 text-lg font-medium">{user.name}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-500 text-sm font-semibold">Email</p>
                        <p className="text-gray-900 text-lg font-medium">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-semibold">Role</p>
                        <p className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {user.role}
                        </p>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};

export default ProfilePage;
