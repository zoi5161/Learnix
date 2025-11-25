// services/authService.js
import api from './axiosInstance';
import axios from 'axios';
import { setAccessToken, setRefreshToken, clearAuth } from '../utils/authToken';

const authService = {
    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data;
    },

    register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        return data;
    },

    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        // Use plain axios to avoid interceptor and prevent duplicate calls
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken,
        });
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data;
    },

    logout: () => {
        clearAuth();
    },
};

export default authService;
