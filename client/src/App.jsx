import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import InstructorDashboard from './pages/Dashboard/InstructorDashboard'; // NEW
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import BaseLayout from './layouts/BaseLayout';

const PrivateRoute = ({ children, roles }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <BaseLayout><h1>403 Forbidden</h1><p>You do not have permission to view this page.</p></BaseLayout>;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route path="/student/dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
                <Route path="/instructor/dashboard" element={<PrivateRoute roles={['instructor']}><InstructorDashboard /></PrivateRoute>} />
                <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
                
                <Route path="*" element={<BaseLayout><h1>404 Not Found</h1></BaseLayout>} />
            </Routes>
        </Router>
    );
};

export default App;