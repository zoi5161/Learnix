import api from './axiosInstance';
import { Course } from '../types/course';

export interface CourseWithCounts extends Course {
  instructor_id: {
    _id?: string;
    name?: string;
    email?: string;
  };
  enrollmentsCount: number;
  lessonsCount: number;
}

export interface CourseListResponse {
  success: boolean;
  data: {
    courses: CourseWithCounts[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CourseDetailResponse {
  success: boolean;
  data: {
    course: CourseWithCounts & {
      lessons?: Array<{
        _id: string;
        title: string;
        content_type: string;
        description?: string;
        duration?: number;
        is_free: boolean;
        order: number;
      }>;
    };
    isEnrolled: boolean;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface TrendingTagsResponse {
  success: boolean;
  data: TrendingTag[];
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string; // 👈 Thêm dòng này
}

export const courseService = {
  // =========================================================
  // 📌 GET ALL COURSES + FILTER
  // =========================================================
  getCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get<CourseListResponse>(`/courses?${params.toString()}`);
    return response.data;
  },

  // =========================================================
  // 📌 GET COURSE DETAIL
  // =========================================================
  getCourseById: async (id: string): Promise<CourseDetailResponse> => {
    const response = await api.get<CourseDetailResponse>(`/courses/${id}`);
    return response.data;
  },

  // =========================================================
  // 📌 GET CATEGORIES
  // =========================================================
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get<CategoriesResponse>('/courses/categories');
    return response.data;
  },

  // =========================================================
  // 📌 TRENDING TAGS
  // =========================================================
  getTrendingTags: async (limit: number = 10): Promise<TrendingTagsResponse> => {
    const response = await api.get<TrendingTagsResponse>(
      `/courses/tags/trending?limit=${limit}`
    );
    return response.data;
  },

  // =========================================================
  // 📌 SEARCH COURSES
  // =========================================================
  searchCourses: async (
    query: string,
    page: number = 1,
    limit: number = 12
  ): Promise<CourseListResponse> => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await api.get<CourseListResponse>(`/courses/search?${params.toString()}`);
    return response.data;
  },

  // =========================================================
  // 🔥🔥🔥 ADMIN CRUD — FULL FEATURES BELOW 🔥🔥🔥
  // =========================================================

  // ==========================
  // 📌 CREATE COURSE
  // ==========================
  createCourse: async (data: Partial<Course>): Promise<any> => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  // ==========================
  // 📌 UPDATE COURSE
  // ==========================
  updateCourse: async (id: string, data: Partial<Course>): Promise<any> => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  // ==========================
  // 📌 DELETE COURSE
  // ==========================
  deleteCourse: async (id: string): Promise<any> => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // ==========================
  // 📌 PUBLISH COURSE
  // ==========================
  publishCourse: async (id: string): Promise<any> => {
    const response = await api.patch(`/courses/${id}/publish`);
    return response.data;
  },

  // ==========================
  // 📌 UNPUBLISH COURSE
  // ==========================
  unpublishCourse: async (id: string): Promise<any> => {
    const response = await api.patch(`/courses/${id}/unpublish`);
    return response.data;
  },

  // ==========================
  // 📌 ASSIGN INSTRUCTOR
  // ==========================
  assignInstructor: async (courseId: string, instructorId: string): Promise<any> => {
    const response = await api.patch(`/courses/${courseId}/assign-instructor`, {
      instructorId,
    });
    return response.data;
  },

  // ==========================
  // 📌 ADD TAG
  // ==========================
  addTag: async (courseId: string, tag: string): Promise<any> => {
    const response = await api.patch(`/courses/${courseId}/tags/add`, { tag });
    return response.data;
  },

  // ==========================
  // 📌 REMOVE TAG
  // ==========================
  removeTag: async (courseId: string, tag: string): Promise<any> => {
    const response = await api.patch(`/courses/${courseId}/tags/remove`, { tag });
    return response.data;
  },

  // ==========================
  // 📌 CHANGE CATEGORY
  // ==========================
  changeCategory: async (courseId: string, category: string): Promise<any> => {
    const response = await api.patch(`/courses/${courseId}/category`, { category });
    return response.data;
  },
};
