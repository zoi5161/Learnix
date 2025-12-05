import React, { useState, useEffect } from 'react';
import BaseLayout from '../../../layouts/BaseLayout';
import { Link, useNavigate } from 'react-router-dom';

// Component Thống kê (Dùng chung)
interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, color }) => (
    <div className={`bg-white border-l-4 border-${color}-500 p-6 rounded-lg shadow-md`}>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className={`text-4xl font-extrabold text-${color}-600`}>{value}</p>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
);


const InstructorDashboard: React.FC = () => {
    // Dữ liệu giả định (cần được thay thế bằng API /api/dashboard)
    const [stats] = useState([
        { title: 'Khóa học đã tạo', value: 5, description: 'Đang hoạt động', color: 'indigo' },
        { title: 'Tổng học viên', value: 150, description: 'Trong tất cả các khóa', color: 'red' },
        { title: 'Điểm Quiz TB', value: '78%', description: 'Tuần này', color: 'green' },
        { title: 'Bài đánh giá mới', value: 3, description: 'Cần xem xét', color: 'yellow' },
    ]);

    return (
        <BaseLayout>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h1 className="text-4xl font-bold text-gray-800">Bảng điều khiển Giảng viên</h1>
                    <Link
                        to="/instructor/courses/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        + Tạo Khóa học Mới
                    </Link>
                </div>

                {/* Thống kê Tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                {/* Danh sách Khóa học Gần đây/Học viên */}
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Hoạt động Gần đây</h2>
                    <p className="text-gray-600">
                        {/* Placeholder cho danh sách học viên hoặc các thông báo */}
                        [Dữ liệu học viên mới và điểm quiz trung bình sẽ được hiển thị ở đây.]
                    </p>
                    <Link to="/instructor/courses" className="mt-4 inline-block text-blue-600 hover:underline">
                        Xem tất cả các khóa học của tôi
                    </Link>
                </div>
            </div>
        </BaseLayout>
    );
};

export default InstructorDashboard;