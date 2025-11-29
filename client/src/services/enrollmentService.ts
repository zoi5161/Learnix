import api from './axiosInstance';

export interface Enrollment {
    _id: string;
    student_id: string;
    course_id: {
        _id: string;
        title: string;
        description: string;
        level: string;
        thumbnail?: string;
        price?: number;
        category?: string;
        tags?: string[];
        summary?: string;
    };
    status: 'enrolled' | 'completed' | 'dropped' | 'suspended';
    progress?: {
        completed: number;
        total: number;
        percentage: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface EnrollResponse {
    success: boolean;
    message: string;
    data: {
        enrollment: Enrollment;
        remainingBudget: number;
        remainingBonusCredits: number;
    };
}

export interface MyEnrollmentsResponse {
    success: boolean;
    data: {
        enrollments: Enrollment[];
    };
}

export const enrollmentService = {
    // Enroll in a course
    enrollCourse: async (courseId: string): Promise<EnrollResponse> => {
        const response = await api.post<EnrollResponse>(`/enrollments/courses/${courseId}/enroll`);
        return response.data;
    },

    // Unenroll from a course
    unenrollCourse: async (courseId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/enrollments/courses/${courseId}/enroll`);
        return response.data;
    },

    // Get my enrollments
    getMyEnrollments: async (): Promise<MyEnrollmentsResponse> => {
        const response = await api.get<MyEnrollmentsResponse>('/enrollments/my-courses');
        return response.data;
    },
};

