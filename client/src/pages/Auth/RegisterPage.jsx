import React, { useState } from 'react';
import authService from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Gọi API đăng ký
            await authService.register(name, email, password);

            // Option 1: navigate sang login
            navigate('/login?registered=true');

            // 🔹 Option 2: tự login và redirect đến dashboard
            // const user = await authService.login(email, password);
            // localStorage.setItem("user", JSON.stringify(user));
            // if (user.accessToken) localStorage.setItem("accessToken", user.accessToken);
            // navigate("/dashboard");

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <BaseLayout>
            <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Đăng Ký</h2>

                {error && (
                    <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                        {error}
                    </p>
                )}

                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Tên</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-300"
                    >
                        Đăng Ký Tài Khoản
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:text-blue-800">Đăng nhập</Link>
                </p>
            </div>
        </BaseLayout>
    );
};

export default RegisterPage;
