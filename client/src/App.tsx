import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardRouter from './routes/DashboardRouter';
import PrivateRoute from './components/PrivateRoute';
import AppLoader from './components/AppLoader';
import ProfilePage from './pages/Profile/ProfilePage';
import OAuthSuccess from './pages/Auth/OAuthSuccess';
import HomePage from './pages/Home/HomePage';
import CourseListPage from './pages/Courses/list/CourseListPage';
import CourseDetailPage from './pages/Courses/detail/CourseDetailPage';

const App: React.FC = () => {
    return (
        <Router>
            <AppLoader>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/courses" element={<CourseListPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/login/oauth/success" element={<OAuthSuccess />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard/*"
                        element={
                            <PrivateRoute>
                                <DashboardRouter />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>
            </AppLoader>
        </Router>
    );
};

export default App;
