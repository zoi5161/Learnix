import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    clearAuth,
} from '../utils/authToken';

interface QueuedRequest {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

interface RefreshTokenResponse {
    accessToken: string;
    refreshToken?: string;
}

const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_BASE_URL as string 
});

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null): void => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
    failedQueue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (err: AxiosError) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip interceptor for refresh endpoint to avoid infinite loop
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(err);
        }

        if (err.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axios(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');

                // Use plain axios to avoid interceptor loop
                const { data } = await axios.post<RefreshTokenResponse>(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                setAccessToken(data.accessToken);
                if (data.refreshToken) setRefreshToken(data.refreshToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                }
                processQueue(null, data.accessToken);

                return axios(originalRequest);
            } catch (e) {
                processQueue(e, null);
                clearAuth();
                window.location.href = '/login';
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(err);
    }
);

export default api;
