import api from './axiosInstance';

export interface Lesson {
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

// ---------------------------
// Get lesson detail
// ---------------------------
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
      prev: { _id: string; title: string } | null;
      next: { _id: string; title: string } | null;
      currentIndex: number;
      total: number;
    };
  };
}

// ---------------------------
// Get course lessons
// ---------------------------
export interface CourseLessonsResponse {
  success: boolean;
  data: {
    lessons: Lesson[];
  };
}

// ---------------------------
// Create / Update request
// ---------------------------
export interface CreateLessonRequest {
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
  content: string;
  description?: string;
  duration?: number;
  is_free: boolean;
  order?: number;
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {}

export interface UpdateProgressRequest {
  status?: 'not_started' | 'in_progress' | 'completed';
  completion_percentage?: number;
  time_spent?: number;
  notes?: string;
}

export const lessonService = {
  // ==========================
  // 🎯 Get lesson detail (Student View)
  // ==========================
  getLesson: async (courseId: string, lessonId: string): Promise<LessonResponse> => {
    const response = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  // ==========================
  // 🎯 Get all lessons (Student View - Requires Enrollment)
  // ==========================
  getCourseLessons: async (courseId: string): Promise<CourseLessonsResponse> => {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data;
  },

  // ==========================
  // 🎯 Create lesson
  // ==========================
  createLesson: async (
    courseId: string,
    data: CreateLessonRequest
  ): Promise<{ success: boolean; message: string; lesson: Lesson }> => {
    const response = await api.post(`/courses/${courseId}/lessons`, data);
    return response.data;
  },

  // ==========================
  // 🎯 Update lesson
  // ==========================
  updateLesson: async (
    courseId: string,
    lessonId: string,
    data: UpdateLessonRequest
  ): Promise<{ success: boolean; message: string; lesson: Lesson }> => {
    const response = await api.put(`/courses/${courseId}/lessons/${lessonId}`, data);
    return response.data;
  },

  // ==========================
  // 🎯 Delete lesson
  // ==========================
  deleteLesson: async (
    courseId: string,
    lessonId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  // ==========================
  // 🎯 Update lesson order
  // ==========================
  reorderLessons: async (
    courseId: string,
    orders: Array<{ lessonId: string; order: number }>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/courses/${courseId}/lessons/reorder`, {
      lessons: orders,
    });
    return response.data;
  },

  // ==========================
  // 🎯 Update progress
  // ==========================
  updateProgress: async (
    courseId: string,
    lessonId: string,
    data: UpdateProgressRequest
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(
      `/courses/${courseId}/lessons/${lessonId}/progress`,
      data
    );
    return response.data;
  },

  // ==========================
  // 🎯 Get management lessons (Instructor View - No Enrollment Check)
  // ==========================
  getManagementLessons: async (courseId: string): Promise<{ success: boolean; data: Lesson[] }> => {
    // ✅ Đã sửa endpoint để khớp với Nested Routes ở Backend:
    // /api/courses/:courseId/lessons/manage/all
    const response = await api.get(`/courses/${courseId}/lessons/manage/all`);
    return response.data;
  },
};