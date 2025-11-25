// src/components/AppLoader.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    clearAuth,
} from '../utils/authToken';
import authService from '../services/authService';

const AppLoader = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        // Prevent duplicate calls in React Strict Mode
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        const checkToken = async () => {
            const token = getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Date.now() / 1000;

                // Access token hết hạn
                if (payload.exp && payload.exp < now) {
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) {
                        clearAuth();
                        setLoading(false);
                        return;
                    }

                    // Thử refresh token
                    const data = await authService.refreshToken();
                    setAccessToken(data.accessToken);
                    if (data.refreshToken) setRefreshToken(data.refreshToken);
                }
            } catch (err) {
                console.error('Token refresh failed:', err);
                clearAuth();
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <h1>Đang kiểm tra đăng nhập...</h1>
            </div>
        );
    }

    return children;
};

export default AppLoader;
