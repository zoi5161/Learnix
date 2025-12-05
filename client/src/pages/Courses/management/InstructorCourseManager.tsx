import React from 'react';
import BaseLayout from '../../../layouts/BaseLayout';

const InstructorCourseManager: React.FC = () => {
    return (
        <BaseLayout>
            <div style={{ padding: '20px' }}>
                <h2>Quản lý Khóa học (Instructor)</h2>
                <p>Đây là nơi Giảng viên có thể xem, tạo, chỉnh sửa, và xuất bản khóa học của họ.</p>
            </div>
        </BaseLayout>
    );
};

export default InstructorCourseManager;