import { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/userService';
import { getAllRelations } from '../../services/relationsService';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAllUsers(), getAllRelations('pending')])
      .then(([allUsers, pendingRelations]) => {
        setUsers(allUsers);
        setPendingCount(pendingRelations.length);
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard__loader"><Loader /></div>;
  if (error) return <p className="dashboard__error">{error}</p>;

  const studentCount = users.filter((u) => u.role === 'student').length;
  const teacherCount = users.filter((u) => u.role === 'teacher').length;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Admin Dashboard</h1>

      <div className="dashboard__stats-grid">
        <StatCard title="Total Users" value={users.length} />
        <StatCard title="Students" value={studentCount} />
        <StatCard title="Teachers" value={teacherCount} />
        <StatCard title="Pending Requests" value={pendingCount} />
      </div>

    </div>
  );
}

export default AdminDashboard;
