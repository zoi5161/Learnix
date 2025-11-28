import React from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../utils/authToken';

interface ProgressSummaryCardProps {
    title: string;
    value: string | number;
    color: string;
}

interface CourseCardProps {
    title: string;
    progress: number;
}

interface Course {
    id: number;
    title: string;
    progress: number;
}

// Thẻ tóm tắt tiến độ (để giữ code Tailwind gọn gàng)
const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({ title, value, color }) => (
    <div className={`bg-${color}-50 border border-${color}-200 p-6 rounded-lg shadow-md`}>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className={`text-4xl font-extrabold text-${color}-600`}>{value}</p>
    </div>
);

// Thẻ khóa học đang học
const CourseCard: React.FC<CourseCardProps> = ({ title, progress }) => (
    <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
                className="bg-yellow-500 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{progress}% Complete</p>
    </div>
);

const StudentDashboard: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    const enrolledCourses: Course[] = [
        { id: 1, title: 'IT Foundation: Python Basics', progress: 45 },
        { id: 2, title: 'Web Development with React', progress: 80 },
        { id: 3, title: 'Database Management (SQL)', progress: 10 },
    ];
    
    const totalProgress =
        Math.floor(
            enrolledCourses.reduce((sum, course) => sum + course.progress, 0) /
                enrolledCourses.length
        ) || 0;

    if (!user || user.role !== 'student') {
        navigate('/login');
        return null;
    }

    return (
        <BaseLayout>
            <div className="w-full">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-3">
                    Chào mừng, {user.name}!
                </h1>

                {/* Phần Tóm Tắt Chung */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <ProgressSummaryCard
                        title="Courses Enrolled"
                        value={enrolledCourses.length}
                        color="indigo"
                    />
                    <ProgressSummaryCard
                        title="Overall Progress"
                        value={`${totalProgress}%`}
                        color="yellow"
                    />
                    <ProgressSummaryCard title="Quizzes Taken" value="12" color="green" />
                </div>

                {/* Danh sách Khóa học */}
                <div className="bg-white p-8 rounded-xl shadow-2xl">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Khóa Học Đang Học</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                title={course.title}
                                progress={course.progress}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};

export default StudentDashboard;
