import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStudentProgress } from '../../services/progressService';
import StatCard from '../../components/common/StatCard';
import PageLoader from '../../components/common/PageLoader';
import './StudentProgressPage.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StudentProgressPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = location.state?.name || `Student #${studentId}`;
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStudentProgress(studentId)
      .then(setProgress)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load student progress.'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <PageLoader text="Loading progress…" />;

  if (error) {
    return (
      <div className="student-progress">
        <button type="button" className="student-progress__back" onClick={() => navigate('/students')}>
          ← Back to My Students
        </button>
        <p className="student-progress__error">{error}</p>
      </div>
    );
  }

  const successRate =
    progress.completedLessonsCount > 0
      ? Math.round((progress.successedLessonsCount / progress.completedLessonsCount) * 100)
      : 0;

  return (
    <div className="student-progress">
      <button type="button" className="student-progress__back" onClick={() => navigate('/students')}>
        ← Back to My Students
      </button>

      <h1 className="student-progress__title">{studentName} — Progress</h1>

      <div className="student-progress__stats">
        <StatCard title="Current Level" value={progress.currentLevel || '—'} />
        <StatCard title="Lessons Completed" value={progress.completedLessonsCount ?? '—'} />
        <StatCard title="Success Rate" value={`${successRate}%`} />
        <StatCard title="Avg Score" value={progress.overallAverage ?? '—'} subtitle="out of 100" />
      </div>

      {progress.lastActivityDate && (
        <p className="student-progress__last-active">
          Last active: {formatDate(progress.lastActivityDate)}
        </p>
      )}
    </div>
  );
}

export default StudentProgressPage;
