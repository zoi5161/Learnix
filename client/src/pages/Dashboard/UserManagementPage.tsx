import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseLayout from '../../layouts/BaseLayout';
import userService from '../../services/userService';
import { User } from '../../types/auth';
import './UserManagementPage.css';

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
    <BaseLayout>
      <div className="user-management-container">
        {/* Header Section */}
        <div className="user-management-header">
          <div className="user-management-header-content">
            <div className="user-management-header-left">
              <button className="user-management-back-btn" onClick={() => navigate('/dashboard')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <div className="user-management-header-text">
                <h1>👥 User Management</h1>
                <p>Manage user roles and account status</p>
              </div>
            </div>
            <div className="user-management-stats">
              <p>Total Users</p>
              <p>{users.length}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="user-management-content">
          {loading ? (
            <div className="user-management-loading">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading users...</p>
            </div>
          ) : error ? (
            <div className="user-management-error">
              <div className="user-management-error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="user-management-table-wrapper">
              <table className="user-management-table">
                <thead>
                  <tr>
                    <th>User Info</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className={u.isLocked ? 'user-locked' : ''}>
                      <td>
                        <div className="user-avatar-cell">
                          <div className="user-avatar">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="user-info-text">
                            <h3>{u.name}</h3>
                            <p>ID: {u._id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={updating === u._id}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="user-role-select"
                          aria-label={`Change role for ${u.name}`}
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {u.isLocked ? (
                          <span className="user-status-badge locked">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Locked
                          </span>
                        ) : (
                          <span className="user-status-badge active">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`user-action-btn ${u.isLocked ? 'unlock' : 'lock'}`}
                          disabled={updating === u._id}
                          onClick={() => handleLockToggle(u._id, u.isLocked || false)}
                        >
                          {updating === u._id ? (
                            <>
                              <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              {u.isLocked ? (
                                <>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                  Unlock
                                </>
                              ) : (
                                <>
                                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Lock
                                </>
                              )}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {!loading && !error && (
          <div className="user-footer-stats">
            <div className="user-stats-grid">
              <div className="user-stat-card students">
                <p> Total Students</p>
                <p>{users.filter(u => u.role === 'student').length}</p>
              </div>
              <div className="user-stat-card instructors">
                <p> Total Instructors</p>
                <p>{users.filter(u => u.role === 'instructor').length}</p>
              </div>
              <div className="user-stat-card admins">
                <p> Total Admins</p>
                <p>{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default UserManagementPage;
