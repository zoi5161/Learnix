import React from 'react';

import BaseLayout from '../layouts/BaseLayout';

import { Routes, Route, Navigate } from 'react-router-dom';

import InstructorCourseManager from '../pages/Courses/management/InstructorCourseManager.tsx'; 



import StudentDashboard from '../pages/Dashboard/StudentDashboard';

import InstructorDashboard from '../pages/Dashboard/InstructorDashboard';

import AdminDashboard from '../pages/Dashboard/AdminDashboard';

import { getUserFromToken } from '../utils/authToken';



interface ProtectedRouteProps {

    element: React.ComponentType<any>; 

    allowedRoles: string[]; 

}



const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element: Element, allowedRoles, ...rest }) => {

    const user = getUserFromToken();

    if (!user) return <Navigate to="/login" replace />; 

    

    if (!allowedRoles.includes(user.role)) {

        return (

            <BaseLayout>

                <h1>403 Forbidden</h1>

                <p>You do not have permission to access this page.</p>

            </BaseLayout>

        );

    }

    return <Element {...rest} />; 

};





const DashboardRouter: React.FC = () => {

    const user = getUserFromToken();

    if (!user) return null; 



    return (

        <Routes>

            <Route path="student/dashboard" element={<ProtectedRoute element={StudentDashboard} allowedRoles={['student']} />} />

            <Route path="instructor/dashboard" element={<ProtectedRoute element={InstructorDashboard} allowedRoles={['instructor', 'admin']} />} />

            <Route path="instructor/courses" element={<ProtectedRoute element={InstructorCourseManager} allowedRoles={['instructor', 'admin']} />} />

            <Route path="instructor/courses/new" element={<ProtectedRoute element={InstructorCourseManager} allowedRoles={['instructor', 'admin']} />} /> 

            <Route path="instructor/courses/:courseId/edit" element={<ProtectedRoute element={InstructorCourseManager} allowedRoles={['instructor', 'admin']} />} /> 

            <Route path="admin/dashboard" element={<ProtectedRoute element={AdminDashboard} allowedRoles={['admin']} />} />

            <Route path="*" element={

                <BaseLayout>

                    <h1>404 Not Found</h1>

                </BaseLayout>

            } />

        </Routes>

    );

};



export default DashboardRouter;