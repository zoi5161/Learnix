import {jwtDecode} from "jwt-decode";

// Save access token
export const setAccessToken = (token) => {
    localStorage.setItem("accessToken", token);
};

// Get access token
export const getAccessToken = () => {
    return localStorage.getItem("accessToken");
};

// Save refresh token
export const setRefreshToken = (token) => {
    localStorage.setItem("refreshToken", token);
};

// Get refresh token
export const getRefreshToken = () => {
    return localStorage.getItem("refreshToken");
};

// Decode JWT to get user info
export const decodeToken = (token) => {
    try {
        const payload = jwtDecode(token);
        const { id, name, email, role, exp } = payload;
        return { userId: id, name, email, role, exp };
    } catch (err) {
        console.error("Invalid JWT token", err);
        return null;
    }
};

/**
 * Get current user from accessToken (synchronous)
 * - Nếu accessToken hết hạn → trả về null
 * - Không gọi refresh token
 */
export const getUserFromToken = () => {
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
export const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};
