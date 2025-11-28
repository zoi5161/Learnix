// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserFromToken } from '../utils/authToken';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const user = getUserFromToken();
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

export default PrivateRoute;
