// services/api/userApi.js
import api from './axiosInstance';

const userService = {
    getProfile: async () => {
        const { data } = await api.get('/user/profile'); // backend trả user info
        return data;
    },

    updateProfile: async (updateData) => {
        const { data } = await api.put('/user/profile', updateData);
        return data;
    },

    getAllUsers: async () => {
        const { data } = await api.get('/user'); // nếu admin
        return data;
    },
};

export default userService;
