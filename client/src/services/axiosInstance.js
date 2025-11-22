import axios from "axios";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuth } from "../utils/authToken";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
};

api.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    async err => {
        const originalRequest = err.config;
        
        // Skip interceptor for refresh endpoint to avoid infinite loop
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(err);
        }
        
        if (err.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axios(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                // Use plain axios to avoid interceptor loop
                const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken });

                setAccessToken(data.accessToken);
                if (data.refreshToken) setRefreshToken(data.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                processQueue(null, data.accessToken);

                return axios(originalRequest);
            } catch (e) {
                processQueue(e, null);
                clearAuth();
                window.location.href = "/login";
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(err);
    }
);

export default api;
