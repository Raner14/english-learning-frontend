import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllRelations, updateRelationStatus } from '../../services/relationsService';
import { getAllUsers } from '../../services/userService';
import { getAllTeachers } from '../../services/teacherService';
import PlaceholderView from '../../components/common/PlaceholderView';
import PageLoader from '../../components/common/PageLoader';
import './RelationsPage.css';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
];

function StatusBadge({ status }) {
  return (
    <span className={`rel-badge rel-badge--${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function RelationsPage() {
  const { user } = useAuth();

  const [relations, setRelations] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [teacherMap, setTeacherMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Per-relation action state: { [relationId]: 'idle'|'accepting'|'rejecting' }
  const [actionStatus, setActionStatus] = useState({});
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    Promise.all([
      getAllRelations(),
      getAllUsers(),
      getAllTeachers(),
    ])
      .then(([rels, users, teachers]) => {
        setRelations(rels);

        const uMap = {};
        users.forEach((u) => {
          uMap[u.userID ?? u.id] = `${u.firstName} ${u.lastName}`;
        });
        setUserMap(uMap);

        const tMap = {};
        teachers.forEach((t) => {
          tMap[t.teacherId] = `${t.firstName} ${t.lastName}`;
        });
        setTeacherMap(tMap);
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load relations.'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'admin') return <PlaceholderView title="Relations" />;
  if (loading) return <PageLoader text="Loading relations..." />;

  async function handleUpdateStatus(relationId, status) {
    const key = status === 'active' ? 'accepting' : 'rejecting';
    setActionStatus((prev) => ({ ...prev, [relationId]: key }));
    setActionError('');

    try {
      await updateRelationStatus(relationId, status);
      setRelations((prev) =>
        prev.map((r) => r.relationId === relationId ? { ...r, status } : r)
      );
    } catch (err) {
      setActionError(err?.response?.data?.error?.message || 'Failed to update relation.');
    } finally {
      setActionStatus((prev) => ({ ...prev, [relationId]: 'idle' }));
    }
  }

  const displayed = activeTab === 'all'
    ? relations
    : relations.filter((r) => r.status === activeTab);

  const counts = {
    all: relations.length,
    pending: relations.filter((r) => r.status === 'pending').length,
    active: relations.filter((r) => r.status === 'active').length,
    rejected: relations.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="relations-page">
      <h1 className="relations-page__title">Student–Teacher Relations</h1>

      <div className="relations-page__tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`relations-tab${activeTab === tab.key ? ' relations-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="relations-tab__count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {error && <p className="relations-page__error">{error}</p>}
      {actionError && <p className="relations-page__action-error">{actionError}</p>}

      {displayed.length === 0 ? (
        <p className="relations-page__empty">No relations found.</p>
      ) : (
        <div className="relations-table-wrap">
          <table className="relations-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((rel) => {
                const busy = actionStatus[rel.relationId];
                return (
                  <tr key={rel.relationId}>
                    <td className="relations-table__name">
                      {userMap[rel.studentId] || `Student #${rel.studentId}`}
                    </td>
                    <td className="relations-table__name">
                      {teacherMap[rel.teacherId] || `Teacher #${rel.teacherId}`}
                    </td>
                    <td><StatusBadge status={rel.status} /></td>
                    <td className="relations-table__date">{formatDate(rel.createdAt)}</td>
                    <td className="relations-table__actions">
                      {rel.status === 'pending' && (
                        <span className="relations-table__btn-group">
                          <button
                            type="button"
                            className="relations-table__btn relations-table__btn--accept"
                            onClick={() => handleUpdateStatus(rel.relationId, 'active')}
                            disabled={!!busy}
                          >
                            {busy === 'accepting' ? 'Accepting…' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            className="relations-table__btn relations-table__btn--reject"
                            onClick={() => handleUpdateStatus(rel.relationId, 'rejected')}
                            disabled={!!busy}
                          >
                            {busy === 'rejecting' ? 'Rejecting…' : 'Reject'}
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RelationsPage;
