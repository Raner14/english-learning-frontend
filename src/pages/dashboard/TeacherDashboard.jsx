import { useState, useEffect } from 'react';
import { getMyStudents, getPendingRequests, updateRelationStatus } from '../../services/relationsService';
import { getMyReviews } from '../../services/teacherService';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

function TeacherDashboard() {
  const { socket } = useSocket();
  const [activeCount, setActiveCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    Promise.all([getMyStudents(), getPendingRequests(), getMyReviews()])
      .then(([students, pending, reviews]) => {
        setActiveCount(students.length);
        setPendingRequests(pending);
        setAvgRating(reviews.avgRating);
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Real-time: add new student request to the list without refresh
  useEffect(() => {
    if (!socket) return;
    function handleNewRequest(data) {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.relationId === data.relationId)) return prev;
        return [...prev, {
          relationId: data.relationId,
          studentId: data.studentId,
          firstName: data.studentName?.split(' ')[0] || 'Student',
          lastName: data.studentName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date().toISOString(),
        }];
      });
    }
    socket.on('relation:requested', handleNewRequest);
    return () => socket.off('relation:requested', handleNewRequest);
  }, [socket]);

  async function handleAction(relationId, status) {
    setActionLoading((prev) => ({ ...prev, [relationId]: true }));
    try {
      await updateRelationStatus(relationId, status);
      // Remove the request from the pending list
      setPendingRequests((prev) => prev.filter((r) => r.relationId !== relationId));
      // If accepted, reflect the new student in the active count
      if (status === 'active') {
        setActiveCount((prev) => prev + 1);
      }
    } catch {
      // In a real app we'd show a toast here
    } finally {
      setActionLoading((prev) => ({ ...prev, [relationId]: false }));
    }
  }

  if (loading) return <div className="dashboard__loader"><Loader /></div>;
  if (error) return <p className="dashboard__error">{error}</p>;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">My Dashboard</h1>

      <div className="dashboard__stats-grid">
        <StatCard title="Active Students" value={activeCount} />
        <StatCard title="Pending Requests" value={pendingRequests.length} />
        <StatCard
          title="Avg Rating"
          value={avgRating > 0 ? Number(avgRating).toFixed(1) : '—'}
          subtitle="out of 5"
        />
      </div>

      <Card className="dashboard__highlight-card">
        <p className="dashboard__section-label">Student Requests</p>

        {pendingRequests.length === 0 ? (
          <p className="dashboard__empty-text">No pending requests at the moment.</p>
        ) : (
          <ul className="dashboard__request-list">
            {pendingRequests.map((req) => (
              <li key={req.relationId} className="dashboard__request-item">
                <div className="dashboard__request-info">
                  <span className="dashboard__request-name">
                    {req.firstName} {req.lastName}
                  </span>
                  <span className="dashboard__request-date">{formatDate(req.createdAt)}</span>
                </div>
                <div className="dashboard__request-actions">
                  <Button
                    onClick={() => handleAction(req.relationId, 'active')}
                    isLoading={actionLoading[req.relationId]}
                    disabled={!!actionLoading[req.relationId]}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(req.relationId, 'rejected')}
                    isLoading={actionLoading[req.relationId]}
                    disabled={!!actionLoading[req.relationId]}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default TeacherDashboard;
