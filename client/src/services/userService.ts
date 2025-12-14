// services/userService.ts
import api from './axiosInstance';
import type { User, ApiResponse } from '@/types';

interface UpdateProfileData {
    name?: string;
    email?: string;
    // Add other updatable fields as needed
}

const userService = {
    getProfile: async (): Promise<User> => {
        const { data } = await api.get<User>('/user/profile');
        return data;
    },

    updateProfile: async (updateData: UpdateProfileData): Promise<User> => {
        const { data } = await api.put<ApiResponse<User>>('/user/profile', updateData);
        return data.data!;
    },

    getAllUsers: async (): Promise<User[]> => {
        const { data } = await api.get<User[]>('/user/all');
        return data;
    },

    updateUserRole: async (userId: string, role: string): Promise<void> => {
        await api.put('/user/role', { userId, role });
    },

    setUserLock: async (userId: string, isLocked: boolean): Promise<void> => {
        await api.put('/user/lock', { userId, isLocked });
    },
};

export default userService;
