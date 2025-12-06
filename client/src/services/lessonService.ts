import api from './axiosInstance';

export interface LessonData {
    _id: string;
    course_id: string;
    title: string;
    content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
    content: string;
    description?: string;
    duration?: number;
    is_free: boolean;
    order: number;
    progress?: {
        status: 'not_started' | 'in_progress' | 'completed';
        completion_percentage: number;
        time_spent: number;
        notes?: string;
    };
}

export interface Lesson extends LessonData {
}

export interface LessonOperationResponse {
    success: boolean;
    data?: {
        lesson: Lesson;
    };
    message?: string;
}

export interface LessonResponse {
    success: boolean;
    data: {
        lesson: Lesson & {
            progress: {
                status: string;
                completion_percentage: number;
                time_spent: number;
                notes?: string;
            } | null;
        };
        course: {
            _id: string;
            title: string;
        };
        navigation: {
            prev: {
                _id: string;
                title: string;
            } | null;
            next: {
                _id: string;
                title: string;
            } | null;
            currentIndex: number;
            total: number;
        };
    };
}

export interface CourseLessonsResponse {
    success: boolean;
    data: {
        lessons: Lesson[];
    };
}

export interface UpdateProgressRequest {
    status?: 'not_started' | 'in_progress' | 'completed';
    completion_percentage?: number;
    time_spent?: number;
    notes?: string;
}

export const lessonService = {
    // Get lesson content
    getLesson: async (courseId: string, lessonId: string): Promise<LessonResponse> => {
        const response = await api.get<LessonResponse>(`/courses/${courseId}/lessons/${lessonId}`);
        return response.data;
    },

    // Get all lessons for a course
    getCourseLessons: async (courseId: string): Promise<CourseLessonsResponse> => {
        const response = await api.get<CourseLessonsResponse>(`/courses/${courseId}/lessons`);
        return response.data;
    },

    // Update lesson progress
    updateProgress: async (
        courseId: string,
        lessonId: string,
        data: UpdateProgressRequest
    ): Promise<{ success: boolean; message: string }> => {
        const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/progress`, data);
        return response.data;
    },

    // Create a new lesson
    createLesson: async (courseId: string, data: LessonData): Promise<LessonOperationResponse> => {
        const response = await api.post<LessonOperationResponse>(`/courses/${courseId}/lessons`, data);
        return response.data;
    },

    // Update an existing lesson
    updateLesson: async (courseId: string, lessonId: string, data: Partial<LessonData>): Promise<LessonOperationResponse> => {
        const response = await api.put<LessonOperationResponse>(`/courses/${courseId}/lessons/${lessonId}`, data);
        return response.data;
    },
    
    // Delete a lesson
    deleteLesson: async (courseId: string, lessonId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/courses/${courseId}/lessons/${lessonId}`);
        return response.data;
    },
};

