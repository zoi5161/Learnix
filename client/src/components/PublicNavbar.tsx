import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserFromToken, clearAuth } from '../utils/authToken';
import './PublicNavbar.css';

const getRolePath = (role: string): string => {
    if (role === 'admin') return 'admin';
    if (role === 'instructor') return 'instructor';
    return 'student';
};

const PublicNavbar: React.FC = () => {
    const user = getUserFromToken();
    const navigate = useNavigate();

    const handleLogout = (): void => {
        clearAuth();
        navigate('/');
    };
    
    const dashboardPath = user ? `/${getRolePath(user.role)}/dashboard` : '/login';

    return (
        <header className="public-navbar">
            <nav className="public-navbar-container">
                <Link to="/" className="public-navbar-logo">
                    Learnix
                </Link>

                <div className="public-navbar-menu">
                    <Link to="/" className="public-navbar-link">
                        Home
                    </Link>
                    <Link to="/courses" className="public-navbar-link">
                        Courses
                    </Link>
                </div>

                <div className="public-navbar-auth">
                    {user ? (
                        <>
                            <Link to={dashboardPath} className="public-navbar-link">
                                Dashboard
                            </Link>
                            <span className="public-navbar-user">
                                {user.name} ({user.role})
                            </span>
                            <button
                                onClick={handleLogout}
                                className="public-navbar-button public-navbar-button-logout"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="public-navbar-link">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="public-navbar-button public-navbar-button-primary"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default PublicNavbar;

