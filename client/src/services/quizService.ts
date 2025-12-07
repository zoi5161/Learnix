import api from './axiosInstance';

// =======================================
// 📌 Interfaces
// =======================================
export interface QuizQuestion {
    _id?: string;
    question: string; // Mapping với question_text ở BE
    options: string[];
    correctAnswer: number;
}

export interface Quiz {
    _id: string;
    id: string; // Thêm field này để tiện dùng ở FE
    title: string;
    course_id?: string | { _id: string; title: string }; // Có thể là string ID hoặc Object (nếu populate)
    lesson_id?: string | { _id: string; title: string };
    description?: string;
    time_limit?: number;
    questions?: QuizQuestion[];
    is_published?: boolean;
    questionsCount?: number; // Backend trả về sẵn số này
    courseTitle?: string;    // Backend trả về (nếu populate) hoặc FE tự map
    lessonTitle?: string;    // Backend trả về (nếu populate) hoặc FE tự map
    createdAt?: string;
}

// Interface cho params truyền vào
export interface QuizQueryParams {
    limit?: number;
    page?: number;
    course_id?: string;
    lesson_id?: string;
    search?: string;
}

export interface QuizCreateRequest {
    title: string;
    course_id?: string;
    lesson_id?: string;
    description?: string;
    time_limit?: number;
    questions: {
        question: string;
        options: string[];
        correctAnswer: number;
    }[];
}

export interface QuizSubmission {
    quizId: string;
    answers: {
        questionIndex: number;
        selectedOption: number;
    }[];
}

// =======================================
// 📌 SERVICE
// =======================================
export const quizService = {

    // ✅ GET LIST (Sửa lại logic map data)
    getQuizzes: async (params: QuizQueryParams = {}) => {
        // Axios tự động biến object params thành query string
        // Ví dụ: { course_id: '123' } -> /quizzes?course_id=123
        const response = await api.get('/quizzes', { params });

        // Normalize data khớp với Backend Controller mới
        if (response.data?.data?.quizzes) {
            response.data.data.quizzes = response.data.data.quizzes.map((q: any) => ({
                ...q,
                id: q._id, // Map _id sang id
                // Backend mới đã trả về questionsCount, nên ưu tiên dùng nó. 
                // Nếu không có mới đếm mảng questions (fallback)
                questionsCount: q.questionsCount ?? q.questions?.length ?? 0,

                // Xử lý title nếu Backend đã populate
                courseTitle: typeof q.course_id === 'object' ? q.course_id.title : (q.courseTitle || 'Unknown'),
                lessonTitle: typeof q.lesson_id === 'object' ? q.lesson_id.title : (q.lessonTitle || 'No Lesson'),
            }));
        }
        return response.data;
    },

    getQuizById: async (id: string) => {
        const response = await api.get(`/quizzes/${id}`);
        return response.data;
    },

    createQuiz: async (payload: QuizCreateRequest) => {
        return (await api.post(`/quizzes`, payload)).data;
    },

    updateQuiz: async (id: string, payload: QuizCreateRequest) => {
        return (await api.put(`/quizzes/${id}`, payload)).data;
    },

    deleteQuiz: async (id: string) => {
        return (await api.delete(`/quizzes/${id}`)).data;
    },

    submitQuiz: async (payload: QuizSubmission) => {
        const response = await api.post(`/quizzes/${payload.quizId}/submit`, payload);
        return response.data;
    },

    getMySubmissions: async (courseId?: string) => { // Thêm dấu ? để optional
        const params = courseId ? { course_id: courseId } : {};
        const response = await api.get(`/quizzes/my-submissions`, { params });
        return response.data;
    },

    getLatestSubmission: async (quizId: string) => {
        // Backend chưa có endpoint riêng thì ta dùng tạm endpoint list rồi filter
        // Tuy nhiên, tốt nhất là gọi: GET /api/quizzes/my-submissions?quiz_id=...
        // Ở đây mình giả lập logic filter từ client cho nhanh:
        const response = await api.get(`/quizzes/my-submissions`);
        if (response.data?.success) {
            const allSubs = response.data.data || [];
            // Tìm bài làm của quiz này (mới nhất)
            const mySub = allSubs.find((s: any) =>
                (s.quiz_id._id === quizId) || (s.quiz_id === quizId)
            );
            return { success: true, data: mySub || null };
        }
        return { success: false, message: "Failed to fetch submission" };
    }
};

export default quizService;