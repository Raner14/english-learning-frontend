import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProgressStats, getProgressChart, getProgressSkills } from '../../services/progressService';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/Card';
import DataTable from '../../components/tables/DataTable';
import PageLoader from '../../components/common/PageLoader';
import './ProgressPage.css';

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ScorePill({ value }) {
  if (value == null) return <span className="score-pill score-pill--none">—</span>;
  const cls = value >= 80 ? 'score-pill--high' : value >= 60 ? 'score-pill--mid' : 'score-pill--low';
  return <span className={`score-pill ${cls}`}>{value}/100</span>;
}

const HISTORY_COLUMNS = [
  { key: 'lessonTitle', label: 'Lesson' },
  { key: 'date', label: 'Date', render: (v) => formatDate(v) },
  {
    key: 'aiScore',
    label: 'AI Score',
    render: (v) => <ScorePill value={v} />,
  },
  {
    key: 'teacherScore',
    label: 'Teacher Score',
    render: (v) => <ScorePill value={v} />,
  },
  {
    key: 'conversationId',
    label: '',
    render: (v) =>
      v ? (
        <Link to={`/conversations/${v}`} className="progress-link-btn">
          View
        </Link>
      ) : '—',
  },
];

function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getProgressStats(),
      getProgressChart(),
      getProgressSkills(),
    ])
      .then(([statsData, chartData, skillsData]) => {
        setStats(statsData);
        setHistory(chartData);
        setSkills(skillsData.skillsRadar || '');
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load progress data.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading progress..." />;

  if (error) {
    return (
      <div className="progress-page">
        <p className="progress-page__error">{error}</p>
      </div>
    );
  }

  const successRate =
    stats.completedLessonsCount > 0
      ? Math.round((stats.successedLessonsCount / stats.completedLessonsCount) * 100)
      : 0;

  return (
    <div className="progress-page">
      <h1 className="progress-page__title">My Progress</h1>

      <div className="progress-page__stats">
        <StatCard title="Current Level" value={stats.currentLevel} />
        <StatCard title="Lessons Completed" value={stats.completedLessonsCount} />
        <StatCard title="Success Rate" value={`${successRate}%`} />
        <StatCard title="Avg Score" value={stats.overallAverage} subtitle="out of 100" />
      </div>

      <section className="progress-page__section">
        <h2 className="progress-page__section-title">Conversation History</h2>
        <DataTable
          columns={HISTORY_COLUMNS}
          data={history}
          emptyMessage="No completed conversations yet. Start a lesson to get your first score!"
        />
      </section>

      {skills && (
        <section className="progress-page__section">
          <h2 className="progress-page__section-title">Skills Feedback</h2>
          <Card>
            <p className="progress-page__skills-text">{skills}</p>
          </Card>
        </section>
      )}

      {stats.lastActivityDate && (
        <p className="progress-page__last-activity">
          Last activity: {formatDate(stats.lastActivityDate)}
        </p>
      )}
    </div>
  );
}

export default ProgressPage;
