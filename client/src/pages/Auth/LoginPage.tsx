import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';
import { getUserFromToken, getAccessToken } from '../../utils/authToken';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = getAccessToken();
        if (token && getUserFromToken()) {
            navigate('/dashboard', { replace: true });
        }

        // Check for error parameter from OAuth redirect
        const errorParam = searchParams.get('error');
        if (errorParam === 'locked') {
            setError('Your account has been locked. Please contact the administrator.');
        }
    }, [navigate, searchParams]);

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');

        try {
            // login → authService lưu access + refresh token
            await authService.login(email, password);

            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleLogin = (): void => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    };

    return (
        <BaseLayout>
            <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Đăng Nhập</h2>

                {error && (
                    <div className={`border px-4 py-3 rounded mb-4 flex items-start ${
                        error.toLowerCase().includes('locked') || error.toLowerCase().includes('block')
                            ? 'bg-red-50 border-red-500'
                            : 'bg-red-100 border-red-400'
                    }`}>
                        {(error.toLowerCase().includes('locked') || error.toLowerCase().includes('block')) && (
                            <svg className="w-5 h-5 text-red-700 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        )}
                        <div className="flex-1">
                            <p className="text-red-700 font-semibold">{error}</p>
                            {(error.toLowerCase().includes('locked') || error.toLowerCase().includes('block')) && (
                                <p className="text-red-600 text-sm mt-1">
                                    If you believe this is an error, please contact support.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            title="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            title="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                    >
                        Đăng Nhập
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <hr className="flex-grow border-gray-300" />
                    <span className="mx-4 text-gray-500 text-sm">HOẶC</span>
                    <hr className="flex-grow border-gray-300" />
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition duration-300"
                >
                    {/* Google icon */}
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 48 48">
                        <path
                            d="M24 9.5c3.54 0 6.7 1.25 9.21 3.52l6.59-6.59C35.29 2.5 29.87 0 24 0 14.88 0 7 5.48 3.55 13.08l6.81 5.23C12.3 13.72 17.65 9.5 24 9.5z"
                            fill="#ea4335"
                        />
                        <path
                            d="M4.09 18.31c-.13.38-.2.77-.2 1.19 0 4.67 3.55 8.78 8.44 10.37l5.23-6.81C13.88 22.8 11 20.8 11 18.31h-6.91z"
                            fill="#fbbc04"
                        />
                        <path
                            d="M24 48c7.87 0 14.83-2.6 19.66-6.95l-6.59-6.59c-3.11 2.3-7.23 3.65-11.57 3.65-6.35 0-11.7-4.22-13.56-10.05l-6.81 5.23C7.3 42.52 15.3 48 24 48z"
                            fill="#34a853"
                        />
                        <path
                            d="M44.42 24c0-1.66-.14-3.23-.4-4.75H24v8.99h12.18c-.46 2.37-1.8 4.4-3.79 5.86l6.59 6.59C42.8 38.6 44.42 32.74 44.42 24z"
                            fill="#4285f4"
                        />
                    </svg>
                    Google
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Bạn chưa có tài khoản?{' '}
                    <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                        Đăng ký
                    </Link>
                </p>
            </div>
        </BaseLayout>
    );
};

export default LoginPage;
