import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';
import authService from '../../services/authService';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError('Liên kết đặt lại mật khẩu không hợp lệ.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(token, password);
            setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseLayout>
            <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Đặt lại mật khẩu</h2>

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
                        <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 disabled:opacity-60"
                    >
                        {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>
        </BaseLayout>
    );
};

export default ResetPasswordPage;
