// services/authService.ts
import api from './axiosInstance';
import axios from 'axios';
import { setAccessToken, setRefreshToken, clearAuth } from '../utils/authToken';
import type { AuthResponse } from '@/types';

interface RefreshTokenResponse {
    accessToken: string;
    refreshToken?: string;
}

const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        setAccessToken(data.accessToken);
        if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
        }
        return data;
    },

    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
        return data;
    },

    forgotPassword: async (email: string): Promise<{ message: string; resetUrl?: string }> => {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    },

    resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
        const { data } = await api.post('/auth/reset-password', { token, password });
        return data;
    },

    refreshToken: async (): Promise<RefreshTokenResponse> => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        // Use plain axios to avoid interceptor and prevent duplicate calls
        const { data } = await axios.post<RefreshTokenResponse>(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refreshToken }
        );
        
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data;
    },

    logout: (): void => {
        clearAuth();
    },
};

export default authService;
