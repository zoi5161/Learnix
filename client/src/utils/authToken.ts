import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  exp: number;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  exp: number;
}

// Save access token
export const setAccessToken = (token: string): void => {
    localStorage.setItem('accessToken', token);
};

// Get access token
export const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

// Save refresh token
export const setRefreshToken = (token: string): void => {
    localStorage.setItem('refreshToken', token);
};

// Get refresh token
export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
};

// Decode JWT to get user info
export const decodeToken = (token: string): UserInfo | null => {
    try {
        const payload = jwtDecode<JWTPayload>(token);
        const { id, name, email, role, exp } = payload;
        return { _id: id, name, email, role, exp };
    } catch (err) {
        console.error('Invalid JWT token', err);
        return null;
    }
};

/**
 * Get current user from accessToken (synchronous)
 * - Nếu accessToken hết hạn → trả về null
 * - Không gọi refresh token
 */
export const getUserFromToken = (): UserInfo | null => {
    const token = getAccessToken();
    if (!token) return null;

    const user = decodeToken(token);
    if (!user) return null;

    const now = Date.now() / 1000;

    // Token hết hạn → xoá luôn token và trả về null
    if (user.exp && user.exp < now) {
        clearAuth();
        return null;
    }

    return user;
};

// Clear all tokens
export const clearAuth = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};
