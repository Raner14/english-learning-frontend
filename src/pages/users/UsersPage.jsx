import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './UsersPage.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_COLORS = {
  student: 'users-page__role--student',
  teacher: 'users-page__role--teacher',
  admin: 'users-page__role--admin',
};

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(userId) {
    setDeletingId(userId);
    setConfirmId(null);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.userID !== userId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  }

  if (user?.role !== 'admin') return <PlaceholderView title="Manage Users" />;
  if (loading) return <PageLoader text="Loading users..." />;

  return (
    <div className="users-page">
      <div className="users-page__header">
        <h1 className="users-page__title">Manage Users</h1>
        <span className="users-page__count">{users.length} users total</span>
      </div>

      {error && <p className="users-page__error">{error}</p>}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userID} className={deletingId === u.userID ? 'users-table__row--deleting' : ''}>
                <td className="users-table__id">{u.userID}</td>
                <td className="users-table__name">{u.firstName} {u.lastName}</td>
                <td className="users-table__email">{u.email}</td>
                <td>
                  <span className={`users-page__role ${ROLE_COLORS[u.role] || ''}`}>
                    {u.role}
                  </span>
                </td>
                <td>{formatDate(u.createDate)}</td>
                <td className="users-table__actions">
                  {confirmId === u.userID ? (
                    <span className="users-table__confirm">
                      <span className="users-table__confirm-label">Delete?</span>
                      <button
                        type="button"
                        className="users-table__btn users-table__btn--danger"
                        onClick={() => handleDelete(u.userID)}
                        disabled={deletingId === u.userID}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="users-table__btn users-table__btn--cancel"
                        onClick={() => setConfirmId(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="users-table__btn users-table__btn--delete"
                      onClick={() => setConfirmId(u.userID)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === u.userID ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;
