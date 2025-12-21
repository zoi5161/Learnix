import api from './axiosInstance';

// ========================================
// 📌 Interfaces
// ========================================

export interface TestCase {
    _id?: string;
    input: string;
    expected_output: string;
    is_hidden?: boolean;
    points?: number;
    description?: string;
}

export interface StarterCode {
    python: string;
    javascript: string;
}

export interface ProgrammingExercise {
    _id: string;
    lesson_id: string;
    title: string;
    description: string;
    starter_code: StarterCode;
    test_cases: TestCase[];
    languages: ('python' | 'javascript')[];
    difficulty: 'easy' | 'medium' | 'hard';
    time_limit: number;
    memory_limit: number;
    is_active: boolean;
    latest_submission?: CodeSubmission;
    createdAt?: string;
    updatedAt?: string;
}

export interface TestResult {
    testCaseIndex: number;
    passed: boolean;
    output: string;
    expected_output: string;
    error: string;
    execution_time: number;
    points_earned: number;
}

export interface RunCodeResponse {
    success: boolean;
    data: {
        test_results: TestResult[];
        score: number;
        passed: boolean;
        total_test_cases: number;
        passed_test_cases: number;
    };
}

export interface CodeSubmission {
    _id: string;
    exercise_id: string;
    student_id: string;
    lesson_id: string;
    language: 'python' | 'javascript';
    code: string;
    test_results: Array<{
        test_case_id: string;
        passed: boolean;
        output: string;
        expected_output: string;
        error: string;
        execution_time: number;
        points_earned: number;
    }>;
    score: number;
    passed: boolean;
    attempt_number: number;
    execution_time: number;
    createdAt: string;
}

export interface CreateExerciseRequest {
    title: string;
    description: string;
    starter_code: StarterCode;
    test_cases: TestCase[];
    languages: ('python' | 'javascript')[];
    difficulty?: 'easy' | 'medium' | 'hard';
    time_limit?: number;
    memory_limit?: number;
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {}

// ========================================
// 📌 SERVICE
// ========================================

export const programmingService = {
    // ==========================
    // 🎯 Get all exercises for a lesson
    // ==========================
    getExercisesByLesson: async (
        courseId: string,
        lessonId: string
    ): Promise<{ success: boolean; data: ProgrammingExercise[] }> => {
        const response = await api.get(
            `/courses/${courseId}/lessons/${lessonId}/exercises`
        );
        return response.data;
    },

    // ==========================
    // 🎯 Get exercise by ID
    // ==========================
    getExercise: async (
        courseId: string,
        lessonId: string,
        exerciseId: string
    ): Promise<{ success: boolean; data: ProgrammingExercise }> => {
        const response = await api.get(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`
        );
        return response.data;
    },

    // ==========================
    // 🎯 Create exercise (Instructor)
    // ==========================
    createExercise: async (
        courseId: string,
        lessonId: string,
        data: CreateExerciseRequest
    ): Promise<{ success: boolean; data: ProgrammingExercise }> => {
        const response = await api.post(
            `/courses/${courseId}/lessons/${lessonId}/exercises`,
            data
        );
        return response.data;
    },

    // ==========================
    // 🎯 Update exercise (Instructor)
    // ==========================
    updateExercise: async (
        courseId: string,
        lessonId: string,
        exerciseId: string,
        data: UpdateExerciseRequest
    ): Promise<{ success: boolean; data: ProgrammingExercise }> => {
        const response = await api.put(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`,
            data
        );
        return response.data;
    },

    // ==========================
    // 🎯 Delete exercise (Instructor)
    // ==========================
    deleteExercise: async (
        courseId: string,
        lessonId: string,
        exerciseId: string
    ): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`
        );
        return response.data;
    },

    // ==========================
    // 🎯 Run code (test with visible test cases)
    // ==========================
    runCode: async (
        courseId: string,
        lessonId: string,
        exerciseId: string,
        code: string,
        language: 'python' | 'javascript'
    ): Promise<RunCodeResponse> => {
        const response = await api.post(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}/run`,
            { code, language }
        );
        return response.data;
    },

    // ==========================
    // 🎯 Submit code (run all test cases)
    // ==========================
    submitCode: async (
        courseId: string,
        lessonId: string,
        exerciseId: string,
        code: string,
        language: 'python' | 'javascript'
    ): Promise<{
        success: boolean;
        data: {
            submission: CodeSubmission;
            test_results: TestResult[];
            score: number;
            passed: boolean;
            total_test_cases: number;
            passed_test_cases: number;
        };
    }> => {
        const response = await api.post(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}/submit`,
            { code, language }
        );
        return response.data;
    },

    // ==========================
    // 🎯 Get submissions
    // ==========================
    getSubmissions: async (
        courseId: string,
        lessonId: string,
        exerciseId: string
    ): Promise<{ success: boolean; data: CodeSubmission[] }> => {
        const response = await api.get(
            `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}/submissions`
        );
        return response.data;
    },
};

export default programmingService;

