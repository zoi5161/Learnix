import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

const register = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/register`, { name, email, password });
    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const authService = { login, register, logout };
export default authService;