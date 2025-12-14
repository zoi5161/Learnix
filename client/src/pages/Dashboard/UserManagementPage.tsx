import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { User } from '../../types/auth';

const roles = ['student', 'instructor', 'admin'] as const;

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Đổi endpoint đúng cho getAllUsers
      const res = await userService.getAllUsers();
      setUsers(res);
    } catch (err: any) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      await userService.updateUserRole(userId, role);
      fetchUsers();
    } catch {
      setError('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleLockToggle = async (userId: string, isLocked: boolean) => {
    setUpdating(userId);
    try {
      await userService.setUserLock(userId, !isLocked);
      fetchUsers();
    } catch {
      setError('Failed to update lock status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <button
          className="mr-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => navigate('/dashboard')}
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className={u.isLocked ? 'bg-red-50' : ''}>
                <td className="border px-4 py-2">{u.name}</td>
                <td className="border px-4 py-2">{u.email}</td>
                <td className="border px-4 py-2">
                  <select
                    value={u.role}
                    disabled={updating === u._id}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="border px-4 py-2">
                  {u.isLocked ? (
                    <span className="text-red-600 font-semibold">Locked</span>
                  ) : (
                    <span className="text-green-600 font-semibold">Active</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  <button
                    className={`px-3 py-1 rounded ${u.isLocked ? 'bg-green-500' : 'bg-red-500'} text-white`}
                    disabled={updating === u._id}
                    onClick={() => handleLockToggle(u._id, u.isLocked || false)}
                  >
                    {u.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementPage;
