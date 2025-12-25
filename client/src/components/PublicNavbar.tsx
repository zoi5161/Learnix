import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken, clearAuth } from '../utils/authToken';
import './PublicNavbar.css';

const PublicNavbar: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    const handleLogout = (): void => {
        clearAuth();
        navigate('/');
    };

    return (
        <header className="f8-navbar">
            <nav className="f8-navbar-container">
                <div className="f8-navbar-left">
                    <Link to="/" className="f8-navbar-logo">
                        <img src="/logo.png" alt="Learnix Logo" className="f8-logo-img" />
                        <span className="f8-slogan">Learnix</span>
                    </Link>
                </div>

                <div className="f8-navbar-center">
                    <div className="f8-search-wrapper">
                        <svg className="f8-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                            className="f8-search-input"
                        />
                    </div>
                </div>

                <div className="f8-navbar-right">
                    {user ? (
                        <>
                            <Link to="/courses" className="f8-nav-link">
                                Khóa học của tôi
                            </Link>
                            <Link to="/dashboard" className="f8-nav-link">
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="f8-btn f8-btn-logout"
                            >
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="f8-nav-link">
                                Đăng nhập
                            </Link>
                            <Link
                                to="/register"
                                className="f8-btn f8-btn-primary"
                            >
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default PublicNavbar;

