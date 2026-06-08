import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgressStats, getNextLesson } from '../../services/progressService';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/Card';
import Loader from '../../components/common/Loader';

function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getProgressStats(),
      getNextLesson().catch(() => null), // 404 is OK — student may have no preferences set yet
    ])
      .then(([statsData, nextLessonData]) => {
        setStats(statsData);
        setNextLesson(nextLessonData);
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard__loader"><Loader /></div>;
  if (error) return <p className="dashboard__error">{error}</p>;

  const successRate =
    stats.completedLessonsCount > 0
      ? Math.round((stats.successedLessonsCount / stats.completedLessonsCount) * 100)
      : 0;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">My Dashboard</h1>

      <div className="dashboard__stats-grid">
        <StatCard title="Current Level" value={stats.currentLevel} />
        <StatCard title="Lessons Completed" value={stats.completedLessonsCount} />
        <StatCard title="Success Rate" value={`${successRate}%`} />
        <StatCard title="Avg Score" value={stats.overallAverage} subtitle="out of 100" />
      </div>

      {nextLesson && (
        <Card className="dashboard__highlight-card">
          <p className="dashboard__section-label">Recommended Next Lesson</p>
          <p className="dashboard__highlight-title">{nextLesson.title}</p>
          <p className="dashboard__highlight-sub">{nextLesson.reason}</p>
          <button
            type="button"
            className="dashboard__cta-button"
            onClick={() => navigate('/lessons')}
          >
            Go to Lessons
          </button>
        </Card>
      )}

      {stats.lastActivityDate && (
        <p className="dashboard__last-activity">
          Last activity: {formatDate(stats.lastActivityDate)}
        </p>
      )}
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

export default StudentDashboard;
