import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Stats {
  users: number;
  courses: number;
  enrollments: number;
}

const SystemStatistics: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get('/api/user/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {
        setError('Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">System Statistics</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold">{stats.users}</div>
            <div className="text-lg mt-2">Total Users</div>
          </div>
          <div className="bg-green-100 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold">{stats.courses}</div>
            <div className="text-lg mt-2">Total Courses</div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold">{stats.enrollments}</div>
            <div className="text-lg mt-2">Total Enrollments</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SystemStatistics;
