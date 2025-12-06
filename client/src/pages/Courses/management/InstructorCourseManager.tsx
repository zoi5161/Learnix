import React, { useState, useEffect } from 'react';
import BaseLayout from '../../../layouts/BaseLayout';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { courseService, CourseWithCounts } from '../../../services/courseService';
import CourseForm from './CourseForm';

// const mockInstructorCourses: CourseWithCounts[] = [
//     { 
//         _id: '60c72b2f9f1b2c001f8e4d2a', 
//         title: 'Khóa học React nâng cao', 
//         level: 'advanced', 
//         status: 'draft', 
//         enrollmentsCount: 0, 
//         lessonsCount: 5,
//         instructor_id: { name: 'Giảng viên' },
//         category: 'Web Dev',
//         summary: 'Khóa học này đang ở trạng thái nháp.',
//         is_premium: true,
//         description: 'desc',
//         createdAt: '',
//         updatedAt: ''
//     } as CourseWithCounts,
//     { 
//         _id: '60c72b2f9f1b2c001f8e4d2b', 
//         title: 'Khóa học Python cho người mới', 
//         level: 'beginner', 
//         status: 'published', 
//         enrollmentsCount: 45, 
//         lessonsCount: 12,
//         instructor_id: { name: 'Giảng viên' },
//         category: 'Programming',
//         summary: 'Khóa học đã xuất bản.',
//         is_premium: false,
//         description: 'desc',
//         createdAt: '',
//         updatedAt: ''
//     } as CourseWithCounts,
// ];

const InstructorCourseManager: React.FC = () => {
    const [courses, setCourses] = useState<CourseWithCounts[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const isNewMode = searchParams.get('mode') === 'new';
    const courseIdToEdit = searchParams.get('editId');
    
    // Hàm gọi API thực để lấy khóa học của Giảng viên
    const fetchInstructorCourses = async () => {
        try {

            setLoading(true);
            setError(null);
            
            const res = await courseService.getInstructorCourses();
            
            if (res.success) {
                setCourses(res.data.courses);
            }
        } catch (err: any) {
             // Lỗi 401/403 sẽ được xử lý bởi axiosInterceptor
             setError(err.message || 'Lỗi khi tải danh sách khóa học của bạn.');
        } finally {
            setLoading(false);
        }
    };
    
    // Hàm xử lý xuất bản (Publish)
    const handlePublish = async (courseId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        if (!window.confirm(`Bạn có chắc chắn muốn chuyển khóa học sang trạng thái "${newStatus}"?`)) {
            return;
        }

        try {
            await courseService.publishCourse(courseId, newStatus as any); 
            alert(`Khóa học đã được chuyển sang ${newStatus}.`);
            setCourses(courses.map(c => c._id === courseId ? { ...c, status: newStatus } as CourseWithCounts : c));
        } catch (error: any) {
            alert(error.message || 'Lỗi khi cập nhật trạng thái.');
        }
    };

    // Hàm xử lý xóa (Delete)
    const handleDelete = async (courseId: string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn khóa học "${title}"?`)) {
            return;
        }
        try {
            await courseService.deleteCourse(courseId);
            alert(`Khóa học "${title}" đã bị xóa.`);
            setCourses(courses.filter(c => c._id !== courseId));
        } catch (error: any) {
            alert(error.message || 'Lỗi khi xóa khóa học.');
        }
    };

    useEffect(() => {
        if (!isNewMode && !courseIdToEdit) {
            fetchInstructorCourses();
        }
    }, [isNewMode, courseIdToEdit]);


    if (isNewMode || courseIdToEdit) {
        return (
            <BaseLayout>
                <Link to="/instructor/courses" className="text-blue-600 hover:underline mb-4 block">
                    &larr; Trở lại Quản lý Khóa học
                </Link>
                <div className="max-w-3xl mx-auto">
                    <CourseForm courseId={courseIdToEdit || undefined} />
                </div>
            </BaseLayout>
        );
    }

    // Màn hình chính: Danh sách khóa học
    return (
        <BaseLayout>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h1 className="text-3xl font-bold text-gray-800">Quản lý Khóa học ({courses.length})</h1>
                    <Link
                        to="/instructor/courses?mode=new"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        + Tạo Khóa học Mới
                    </Link>
                </div>

                {loading ? (
                    <p>Đang tải danh sách...</p>
                ) : error ? (
                    <p className="text-red-600">Lỗi: {error}</p>
                ) : (
                    <div className="space-y-4">
                        {courses.map((course) => (
                            <div key={course._id} className="bg-white p-4 border rounded-lg shadow-sm flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold">{course.title}</h2>
                                    <p className="text-sm text-gray-500">
                                        Học viên: {course.enrollmentsCount} | Trạng thái: 
                                        <span className={`font-medium ml-1 ${course.status === 'published' ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {course.status.toUpperCase()}
                                        </span>
                                    </p>
                                </div>
                                <div className="space-x-2 flex items-center">
                                    <button 
                                        onClick={() => handlePublish(course._id, course.status)}
                                        className={`text-sm px-3 py-1 rounded-md text-white transition ${course.status === 'published' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <Link 
                                        to={`/instructor/courses/${course._id}/lessons`} // Route quản lý Lessons (cần tạo)
                                        className="text-sm px-3 py-1 border rounded-md text-blue-600 hover:bg-blue-50"
                                    >
                                        Quản lý Bài học ({course.lessonsCount})
                                    </Link>
                                    <Link 
                                        to={`/instructor/courses?editId=${course._id}`}
                                        className="text-sm px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-100"
                                    >
                                        Sửa
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(course._id, course.title)}
                                        className="text-sm px-3 py-1 border rounded-md text-red-600 hover:bg-red-50"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </BaseLayout>
    );
};

export default InstructorCourseManager;