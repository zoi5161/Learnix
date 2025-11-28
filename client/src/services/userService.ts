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
        const { data } = await api.get<ApiResponse<User[]>>('/user');
        return data.data!;
    },
};

export default userService;
