import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setAccessToken, setRefreshToken } from "../../utils/authToken"; // helper lưu token

const OAuthSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const accessToken = query.get("accessToken");
        const refreshToken = query.get("refreshToken");

        if (accessToken) {
            // Lưu token
            setAccessToken(accessToken);
            if (refreshToken) setRefreshToken(refreshToken);

            // Redirect tới dashboard duy nhất
            navigate("/dashboard", { replace: true });
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
