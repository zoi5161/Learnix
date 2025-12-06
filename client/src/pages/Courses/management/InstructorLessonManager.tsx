import React, { useState, useEffect } from 'react';
import BaseLayout from '../../../layouts/BaseLayout';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { lessonService, Lesson, LessonOperationResponse } from '../../../services/lessonService';
import LessonForm from './LessonForm'; 
import { getUserFromToken } from '../../../utils/authToken';

const InstructorLessonManager: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>(); 
    const navigate = useNavigate();
    const user = getUserFromToken(); 

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courseTitle, setCourseTitle] = useState('Khóa học (Loading...)'); // Tạm thời
    
    // State cho Form (tạo mới hoặc chỉnh sửa)
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState<Lesson | undefined>(undefined);

    // Hàm gọi API lấy danh sách bài học
    const fetchLessons = async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            const res = await lessonService.getCourseLessons(courseId);
            if (res.success) {
                setLessons(res.data.lessons);
                // NOTE: Cần một API call riêng để lấy Course Title nếu muốn hiển thị.
                setCourseTitle(`Khóa học ID: ${courseId}`); 
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách bài học.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchLessons();
        }
    }, [courseId]);

    // Xử lý khi Form Lưu thành công
    const handleSaveSuccess = () => {
        setIsFormVisible(false);
        setLessonToEdit(undefined);
        fetchLessons(); // Tải lại danh sách
    };

    // Xử lý xóa bài học
    const handleDelete = async (lessonId: string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài học "${title}"?`)) {
            return;
        }
        try {
            await lessonService.deleteLesson(courseId!, lessonId); 
            alert('Bài học đã được xóa thành công.');
            fetchLessons();
        } catch (error: any) {
            alert(error.message || 'Lỗi khi xóa bài học.');
        }
    };
    
    // Logic để mở Form chỉnh sửa
    const openEditForm = (lesson: Lesson) => {
        setLessonToEdit(lesson);
        setIsFormVisible(true);
    };

    // Logic để mở Form tạo mới
    const openCreateForm = () => {
        setLessonToEdit(undefined);
        setIsFormVisible(true);
    };

    // Hiển thị Form tạo/sửa
    if (isFormVisible) {
        return (
            <BaseLayout>
                <div className="p-6 max-w-4xl mx-auto">
                    <button onClick={handleSaveSuccess} className="text-blue-600 hover:underline mb-4 block">
                        &larr; Trở lại Danh sách
                    </button>
                    <LessonForm 
                        courseId={courseId!}
                        lessonId={lessonToEdit?._id}
                        initialData={lessonToEdit}
                        onSave={handleSaveSuccess}
                        onCancel={handleSaveSuccess} // Dùng handleSaveSuccess để đóng form và refresh
                    />
                </div>
            </BaseLayout>
        );
    }

    // Giao diện chính: Danh sách bài học
    return (
        <BaseLayout>
            <div className="p-4">
                <Link to="/instructor/courses" className="text-blue-600 hover:underline mb-4 block">
                    &larr; Trở lại Quản lý Khóa học
                </Link>
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h1 className="text-3xl font-bold text-gray-800">Quản lý Bài học: {courseTitle}</h1>
                    <button
                        onClick={openCreateForm}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        + Thêm Bài học Mới
                    </button>
                </div>

                {loading ? (
                    <p>Đang tải danh sách bài học...</p>
                ) : error ? (
                    <p className="text-red-600">Lỗi: {error}</p>
                ) : lessons.length === 0 ? (
                    <div className="text-center p-10 border rounded-lg bg-gray-50">
                        <p className="text-xl text-gray-600">Khóa học này chưa có bài học nào. Hãy tạo bài học đầu tiên!</p>
                        <button onClick={openCreateForm} className="mt-4 text-blue-600 font-semibold hover:underline">
                            Tạo Bài học Ngay
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lessons.map((lesson) => (
                            <div key={lesson._id} className="bg-white p-4 border rounded-lg shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-semibold text-gray-500 mr-2">#{lesson.order}</span>
                                    <h2 className="text-lg font-semibold inline-block">{lesson.title}</h2>
                                    <p className="text-sm text-gray-500 ml-5">Type: {lesson.content_type} | Duration: {lesson.duration} mins</p>
                                </div>
                                <div className="space-x-2">
                                    <Link 
                                        to={`/instructor/courses/${courseId}/lessons/${lesson._id}/quiz`}
                                        className="text-sm px-3 py-1 border rounded-md text-purple-600 hover:bg-purple-50"
                                    >
                                        Quản lý Quiz
                                    </Link>
                                    <button 
                                        onClick={() => openEditForm(lesson)} // Mở form chỉnh sửa
                                        className="text-sm px-3 py-1 border rounded-md text-blue-600 hover:bg-blue-50"
                                    >
                                        Sửa
                                    </button>
                                    <button 
                                        onClick={() => lesson._id && handleDelete(lesson._id, lesson.title)} // Kiểm tra _id
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

export default InstructorLessonManager;