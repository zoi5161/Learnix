import React, { useState, useEffect } from 'react';
import { courseService, CourseCreateData } from '../../../services/courseService';
import { useNavigate } from 'react-router-dom';

interface CourseFormProps {
    courseId?: string;
    initialData?: CourseCreateData;
}

const initialFormState: CourseCreateData = {
    title: '',
    description: '',
    summary: '',
    category: '',
    level: 'beginner',
    tags: [],
    thumbnail: '',
    price: 0,
};

const CourseForm: React.FC<CourseFormProps> = ({ courseId, initialData }) => {
    const [formData, setFormData] = useState<CourseCreateData>(initialData || initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const dataToSend = {
                ...formData,
                tags: formData.tags ? formData.tags : [],
            };
            
            if (courseId) {
                await courseService.updateCourse(courseId, dataToSend);
                alert('Khóa học đã được cập nhật!');
            } else {
                await courseService.createCourse(dataToSend);
                alert('Khóa học mới đã được tạo!');
            }
            navigate('/instructor/courses');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi lưu khóa học.');
        } finally {
            setLoading(false);
        }
    };

    const isEditMode = !!courseId;

    return (
        <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                {isEditMode ? 'Chỉnh sửa Khóa học' : 'Tạo Khóa học Mới'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tiêu đề */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        Tiêu đề
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                {/* Tóm tắt */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="summary">
                        Tóm tắt (Ngắn)
                    </label>
                    <textarea
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        rows={2}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                {/* Mô tả */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Mô tả Chi tiết
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                {/* Level và Category*/}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="level">
                            Cấp độ
                        </label>
                        <select
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                            Danh mục
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                        Giá (USD)
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
                        Tags (Cách nhau bởi dấu phẩy)
                    </label>
                    <input
                        type="text"
                        name="tags"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold py-2 px-4 rounded transition duration-300 ${
                        loading
                            ? 'bg-gray-500 cursor-not-allowed'
                            : isEditMode
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật Khóa học' : 'Tạo Khóa học'}
                </button>
            </form>
        </div>
    );
};

export default CourseForm;