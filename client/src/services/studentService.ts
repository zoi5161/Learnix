import api from './axiosInstance';

export interface StudentDashboardData {
    success: boolean;
    data: {
        student: {
            name: string;
            email: string;
            budget: number;
            bonus_credits: number;
            total_budget: number;
        };
        statistics: {
            totalEnrolled: number;
            totalCompleted: number;
            overallProgress: number;
        };
        enrolledCourses: Array<{
            _id: string;
            title: string;
            description: string;
            level: string;
            thumbnail?: string;
            category?: string;
            tags?: string[];
            instructor: {
                _id: string;
                name: string;
                email: string;
            };
            progress: {
                completed: number;
                total: number;
                percentage: number;
            };
            status: 'in-progress' | 'completed';
            enrolledAt: string;
        }>;
        suggestedCourses: Array<{
            _id: string;
            title: string;
            description: string;
            level: string;
            thumbnail?: string;
            price?: number;
            category?: string;
            tags?: string[];
            summary?: string;
            instructor_id: {
                _id: string;
                name: string;
                email: string;
            };
            enrollmentsCount: number;
            lessonsCount: number;
        }>;
    };
}

export interface BudgetData {
    success: boolean;
    data: {
        budget: number;
        bonus_credits: number;
        total: number;
    };
}

export const studentService = {
    // Get student dashboard data
    getDashboard: async (): Promise<StudentDashboardData> => {
        const response = await api.get<StudentDashboardData>('/student/dashboard');
        return response.data;
    },

    // Get student budget
    getBudget: async (): Promise<BudgetData> => {
        const response = await api.get<BudgetData>('/student/budget');
        return response.data;
    },
};

