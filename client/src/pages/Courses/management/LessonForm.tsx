import React, { useState, useEffect } from 'react';
import { lessonService, LessonData } from '../../../services/lessonService';
import BaseLayout from '../../../layouts/BaseLayout';
import { useNavigate } from 'react-router-dom';

interface LessonFormProps {
    courseId: string;
    lessonId?: string;
    initialData?: LessonData;
    onSave: () => void;
    onCancel: () => void;
}

// Giả định: LessonData có _id là string | undefined khi khởi tạo
const initialLessonState: LessonData = {
    _id: undefined as unknown as string, // Ép kiểu tạm thời để tránh lỗi TS nếu _id là bắt buộc
    course_id: '',
    title: '',
    content_type: 'text',
    content: '',
    description: '',
    duration: 5,
    is_free: false,
    order: 1,
};

const LessonForm: React.FC<LessonFormProps> = ({ courseId, lessonId, initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<LessonData>({ 
        ...initialLessonState, 
        course_id: courseId 
    } as LessonData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { _id, ...rest } = formData;
        let payload: Partial<LessonData> = rest;

        if (lessonId) payload = formData; 

        try {
            if (lessonId) {
                await lessonService.updateLesson(courseId, lessonId, payload); 
                alert('Bài học đã được cập nhật.');
            } else {
                await lessonService.createLesson(courseId, payload as LessonData);
                alert('Bài học mới đã được tạo.');
            }
            onSave();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi lưu bài học.');
        } finally {
            setLoading(false);
        }
    };

    const isVideo = formData.content_type === 'video';
    const isEditMode = !!lessonId;

    return (
        <div className="bg-white p-6 border rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Chỉnh sửa' : 'Tạo'} Bài học</h2>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tiêu đề */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Tiêu đề Bài học</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500" />
                </div>
                
                {/* Mô tả */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Mô tả (Tùy chọn)</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500"/>
                </div>

                {/* Loại nội dung */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Loại Nội dung</label>
                    <select name="content_type" value={formData.content_type} onChange={handleChange} required className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500">
                        <option value="text">Văn bản/Tài liệu</option>
                        <option value="video">Video Link</option>
                        <option value="quiz" disabled>Quiz (Sắp có)</option>
                    </select>
                </div>
                
                {/* Nội dung (Video Link hoặc Text Area) */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        {isVideo ? 'URL Video (Youtube/Vimeo)' : 'Nội dung Bài học (Markdown/Text)'}
                    </label>
                    {isVideo ? (
                        <input type="url" name="content" value={formData.content} onChange={handleChange} required className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500" placeholder="e.g., https://youtube.com/watch?v=..." />
                    ) : (
                        <textarea name="content" value={formData.content} onChange={handleChange} required rows={5} className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500" />
                    )}
                </div>

                {/* Thứ tự, Thời lượng và Free/Premium */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Thứ tự</label>
                        <input type="number" name="order" value={formData.order} onChange={handleChange} required min={1} className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Thời lượng (phút)</label>
                        <input type="number" name="duration" value={formData.duration} onChange={handleChange} min={0} className="shadow border rounded w-full py-2 px-3 focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div className='flex items-end'>
                        <label className="flex items-center space-x-2 text-gray-700 text-sm font-bold">
                            <input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleChange} className="form-checkbox h-4 w-4 text-yellow-600" />
                            <span>Miễn phí (Free)</span>
                        </label>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                        Hủy
                    </button>
                    <button type="submit" disabled={loading} className={`px-4 py-2 text-white rounded transition ${loading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}>
                        {loading ? 'Đang lưu...' : 'Lưu Bài học'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LessonForm;