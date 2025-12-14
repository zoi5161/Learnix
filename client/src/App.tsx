import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
import LessonViewer from './pages/Courses/LessonViewer/LessonViewer';
import CourseLearnPage from './pages/Courses/CourseLearn/CourseLearnPage';
import LessonManager from './pages/Courses/LessonViewer/LessonManager';
import QuizListPage from './pages/Quizzes/QuizListPage';
import QuizFormPage from './pages/Quizzes/QuizFormPage';
import StudentQuizPage from './pages/Quizzes/StudentQuizPage'
import UserManagementPage from './pages/Dashboard/UserManagementPage';
import CourseModerationPage from './pages/Dashboard/CourseModerationPage';
import SystemStatistics from './pages/Dashboard/SystemStatistics';

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

                    <Route path="/courses/:courseId/manage-lessons" element={<LessonManager />} />
                    <Route path="/courses/:courseId/quizzes/:quizId/take" element={<StudentQuizPage />} />
                    {/* Protected User Routes */}
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

                    <Route
                        path="/courses/:courseId/learn"
                        element={
                            <PrivateRoute>
                                <CourseLearnPage />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/courses/:courseId/lessons/:lessonId"
                        element={
                            <PrivateRoute>
                                <LessonViewer />
                            </PrivateRoute>
                        }
                    />

                    {/* ================================
                       ADMIN ROUTES (Protected)
                    ================================= */}

                    {/* User Management */}
                    <Route
                        path="/admin/users"
                        element={
                            <PrivateRoute>
                                <UserManagementPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Course Moderation (Admin) */}
                    <Route
                        path="/admin/courses/moderation"
                        element={
                            <PrivateRoute>
                                <CourseModerationPage />
                            </PrivateRoute>
                        }
                    />

                    {/* System Statistics (Admin) */}
                    <Route
                        path="/admin/stats"
                        element={
                            <PrivateRoute>
                                <SystemStatistics />
                            </PrivateRoute>
                        }
                    />

                    {/* Courses */}
                    <Route
                        path="/courses"
                        element={
                            <PrivateRoute>
                                <CourseListPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Quizzes */}
                    <Route
                        path="/quizzes"
                        element={
                            <PrivateRoute>
                                <QuizListPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quizzes/create"
                        element={
                            <PrivateRoute>
                                <QuizFormPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quizzes/:id/edit"
                        element={
                            <PrivateRoute>
                                <QuizFormPage />
                            </PrivateRoute>
                        }
                    />

                    {/* 404 */}
                    <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>
            </AppLoader>
        </Router>
    );
};

export default App;
