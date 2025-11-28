export interface Course {
  _id: string;
  instructor_id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  is_premium: boolean;
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
  content: string;
  description?: string;
  duration?: number;
  order: number;
  is_free: boolean;
  createdAt: string;
  updatedAt: string;
}
