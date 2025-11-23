// client/src/pages/Auth/OAuthSuccess.jsx

import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setAccessToken, setRefreshToken } from "../../utils/authToken";
import { jwtDecode } from 'jwt-decode'; // Thư viện giải mã JWT

const OAuthSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const accessToken = query.get("accessToken");
        const refreshToken = query.get("refreshToken");
        
        let role = 'student'; // Mặc định là student
        
        if (accessToken) {
            try {
                // Giải mã Access Token để lấy vai trò (Role)
                const decoded = jwtDecode(accessToken);
                role = decoded.role || 'student'; 
                
                // Lưu token
                setAccessToken(accessToken);
                if (refreshToken) setRefreshToken(refreshToken);

                navigate("/dashboard", { replace: true });

            } catch (e) {
                console.error("Invalid token:", e);
                navigate("/login?error=invalid_token", { replace: true });
            }
        } else {
            navigate("/login?error=oauth_data_missing", { replace: true });
        }
    }, [location.search, navigate]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <h1 className="text-xl font-semibold text-gray-700">
                Đang xử lý đăng nhập...
            </h1>
        </div>
    );
};

export default OAuthSuccess;