import React, { useState } from 'react';
import BaseLayout from '../../layouts/BaseLayout';
import authService from '../../services/authService';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const data = await authService.forgotPassword(email);
            setMessage(data.message || 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseLayout>
            <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Quên mật khẩu</h2>

                {message && (
                    <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 disabled:opacity-60"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                    </button>
                </form>
            </div>
        </BaseLayout>
    );
};

export default ForgotPasswordPage;
