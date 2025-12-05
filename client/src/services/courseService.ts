import api from './axiosInstance';
import { Course } from '../types/course';

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

export interface CourseWithCounts extends Course {
  instructor_id: {
    _id?: string;
    name?: string;
    email?: string;
  };
  enrollmentsCount: number;
  lessonsCount: number;
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
}

export const courseService = {
  // Get all courses with filters
  getCourses: async (filters: CourseFilters = {}): Promise<CourseListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.level) params.append('level', filters.level);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await api.get<CourseListResponse>(`/courses?${params.toString()}`);
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<CourseDetailResponse> => {
    const response = await api.get<CourseDetailResponse>(`/courses/${id}`);
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get<CategoriesResponse>('/courses/categories');
    return response.data;
  },

  // Get trending tags
  getTrendingTags: async (limit: number = 10): Promise<TrendingTagsResponse> => {
    const response = await api.get<TrendingTagsResponse>(`/courses/tags/trending?limit=${limit}`);
    return response.data;
  },

  // Search courses
  searchCourses: async (query: string, page: number = 1, limit: number = 12): Promise<CourseListResponse> => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get<CourseListResponse>(`/courses/search?${params.toString()}`);
    return response.data;
  },

  // Create Course
  createCourse: async (data: CourseCreateData): Promise<CourseDetailResponse> => {
    const response = await api.post<CourseDetailResponse>(`/courses`, data);
    return response.data;
  },

  // Update Course
  updateCourse: async (id: string, data: Partial<CourseCreateData>): Promise<CourseDetailResponse> => {
    const response = await api.put<CourseDetailResponse>(`/courses/${id}`, data);
    return response.data;
  },

  // Delete Course
  deleteCourse: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/courses/${id}`);
    return response.data;
  },
  
  // Publish/Unpublish Course
  publishCourse: async (id: string, status: 'draft' | 'published' | 'archived'): Promise<CourseDetailResponse> => {
    const response = await api.put<CourseDetailResponse>(`/courses/${id}/publish`, { status });
    return response.data;
  },
};

export interface CourseCreateData {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  is_premium?: boolean;
  tags?: string[];
  category: string;
  summary: string;
  thumbnail?: string;
  price?: number;
}