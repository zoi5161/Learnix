import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken, clearAuth } from '../utils/authToken';
import './PublicNavbar.css';

const PublicNavbar: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = (): void => {
        clearAuth();
        setShowUserMenu(false);
        navigate('/');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Get first letter of user name for avatar
    const getInitials = (name: string): string => {
        return name.charAt(0).toUpperCase();
    };

    // Get role display name
    const getRoleDisplayName = (role: string): string => {
        const roleMap: { [key: string]: string } = {
            'student': 'Student',
            'instructor': 'Instructor',
            'admin': 'Administrator'
        };
        return roleMap[role] || role;
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
                            <div className="f8-user-menu-wrapper" ref={menuRef}>
                                <button
                                    className="f8-user-avatar"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    aria-label="User menu"
                                >
                                    {getInitials(user.name)}
                                </button>
                                
                                {showUserMenu && (
                                    <div className="f8-user-dropdown">
                                        <div className="f8-user-dropdown-header">
                                            <div className="f8-user-dropdown-avatar">
                                                {getInitials(user.name)}
                                            </div>
                                            <div className="f8-user-dropdown-info">
                                                <div className="f8-user-dropdown-name">{user.name}</div>
                                                <div className="f8-user-dropdown-email">{user.email}</div>
                                                <div className="f8-user-dropdown-role">{getRoleDisplayName(user.role)}</div>
                                            </div>
                                        </div>
                                        <div className="f8-user-dropdown-divider"></div>
                                        <div className="f8-user-dropdown-menu">
                                            <Link 
                                                to="/profile" 
                                                className="f8-user-dropdown-item"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <span className="f8-user-dropdown-icon">👤</span>
                                                <span>Profile</span>
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link 
                                                    to="/admin/users" 
                                                    className="f8-user-dropdown-item"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <span className="f8-user-dropdown-icon">⚙️</span>
                                                    <span>Admin Panel</span>
                                                </Link>
                                            )}
                                            <button 
                                                className="f8-user-dropdown-item f8-user-dropdown-item-logout"
                                                onClick={handleLogout}
                                            >
                                                <span className="f8-user-dropdown-icon">🚪</span>
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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

