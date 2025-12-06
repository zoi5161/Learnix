import api from './axiosInstance';

export interface QuestionOption {
    text: string;
    is_correct: boolean;
}

export interface QuestionData {
    _id?: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    options?: QuestionOption[]; 
    correct_answer?: string;
    points: number;
}

export interface QuizCreateData {
    lesson_id: string;
    title: string;
    description?: string;
    time_limit?: number;
    attempts_allowed?: number;
    passing_score?: number;
    questions: QuestionData[];
}

export interface QuizSubmission {
    quiz_id: string;
    answers: Array<{
        question_id: string;
        answer: string;
    }>;
}

export interface QuizSubmissionResponse {
    success: boolean;
    data: {
        score: number;
        earned_points: number;
        total_points: number;
    };
    message?: string;
}

export const quizService = {
    createQuiz: async (courseId: string, data: QuizCreateData) => {
        const lessonId = data.lesson_id; 
        console.log('Creating quiz with data:', data);
        const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, data); 
        return response.data;
    },

    getQuizForInstructor: async (courseId: string, lessonId: string) => {
        const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/quiz`);
        return response.data;
    },
    
    updateQuiz: async (courseId: string, data: QuizCreateData) => {
        const lessonId = data.lesson_id;
        const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/quiz`, data); 
        return response.data;
    },
    
    submitQuiz: async (data: QuizSubmission): Promise<QuizSubmissionResponse> => {
        const response = await api.post<QuizSubmissionResponse>('/quizzes/submit', data);
        return response.data;
    },
};