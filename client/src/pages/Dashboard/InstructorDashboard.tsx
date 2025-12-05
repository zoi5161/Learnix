import React, { useState, useEffect } from 'react'; // Bổ sung useState, useEffect
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate, Link } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';
import axios from 'axios';

interface StatCardProps {
    title: string;
    value: string | number;
    color: string;
    linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, linkTo }) => (
    <div className={`bg-white border-l-4 border-${color}-500 p-6 rounded-lg shadow-md`}>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className={`text-4xl font-extrabold text-${color}-600`}>{value}</p>
        {linkTo && (
            <Link to={linkTo} className="text-sm text-blue-500 mt-2 hover:underline block">
                View Details
            </Link>
        )}
    </div>
);


const InstructorDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, avgQuizScore: 'N/A' });
    const [loading, setLoading] = useState(true);
    const user = getUserFromToken();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInstructorData = async () => {
            try {
                // Tạm thời dùng dữ liệu giả cho UI
                setStats({ totalCourses: 7, totalStudents: 185, avgQuizScore: '82%' });
            } catch (error) {
                console.error("Failed to fetch instructor stats");
            } finally {
                setLoading(false);
            }
        };
        fetchInstructorData();
    }, []);

    if (!user || user.role !== 'instructor') {
        navigate('/login');
        return null;
    }

    if (loading) {
        return <BaseLayout><div className="p-10 text-center">Loading Instructor Dashboard...</div></BaseLayout>;
    }


    return (
        <BaseLayout>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h1 className="text-4xl font-bold text-gray-800">Bảng điều khiển Giảng viên</h1>
                    <Link
                        to="/instructor/courses/new" // Chuyển hướng đến Form tạo khóa học
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        + Tạo Khóa học Mới
                    </Link>
                </div>

                {/* Thống kê Tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard 
                        title="Khóa học đã tạo" 
                        value={stats.totalCourses} 
                        color="indigo" 
                        linkTo="/instructor/courses" 
                    />
                    <StatCard 
                        title="Tổng học viên" 
                        value={stats.totalStudents} 
                        color="red" 
                    />
                    <StatCard 
                        title="Điểm Quiz TB" 
                        value={stats.avgQuizScore} 
                        color="green" 
                    />
                    <StatCard 
                        title="Xem Analytics" 
                        value="Go" 
                        color="blue" 
                    />
                </div>
                
                {/* Khu vực quản lý */}
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Quản lý Khóa học</h2>
                    <Link to="/instructor/courses" className="text-blue-600 hover:underline">
                        Xem và chỉnh sửa tất cả khóa học của tôi &rarr;
                    </Link>
                </div>
            </div>
        </BaseLayout>
    );
};

export default InstructorDashboard;