import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuthSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        
        const token = query.get('token');
        const role = query.get('role');
        const name = query.get('name');

        if (token && role && name) {
            const user = { token, role, name: decodeURIComponent(name) };
            localStorage.setItem('user', JSON.stringify(user));
            
            if (role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (role === 'instructor') {
                navigate('/instructor/dashboard', { replace: true });
            } else {
                navigate('/student/dashboard', { replace: true });
            }
        } else {
            navigate('/login?error=oauth_data_missing', { replace: true });
        }
    }, [location.search, navigate]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <h1 className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập...</h1>
        </div>
    );
};

export default OAuthSuccess;