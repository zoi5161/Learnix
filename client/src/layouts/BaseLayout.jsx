import React from 'react';
import { Link } from 'react-router-dom';
import { getUserFromToken, clearAuth } from '../utils/authToken';

const Header = () => {
    const user = getUserFromToken();

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/login';
    };

    return (
        <header className="bg-gray-800 text-white shadow-lg">
            <nav className="container mx-auto flex justify-between items-center p-4">
                <Link
                    to="/"
                    className="text-xl font-bold tracking-widest hover:text-yellow-400 transition"
                >
                    Learnix
                </Link>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <Link
                                to="/profile"
                                className="text-sm hover:text-yellow-400 transition font-medium"
                            >
                                Xin chào, {user.name} ({user.role})
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-yellow-400">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-3 py-1 bg-yellow-500 rounded text-gray-900 hover:bg-yellow-400 transition"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

const BaseLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4">{children}</main>
            <footer className="bg-gray-100 p-4 text-center text-gray-600 border-t">
                © 2025 Learnix | Intelligent E-Learning
            </footer>
        </div>
    );
};

export default BaseLayout;
