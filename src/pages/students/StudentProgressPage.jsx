import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getStudentProgress } from '../../services/progressService';
import { getStudentConversations } from '../../services/conversationService';
import StatCard from '../../components/common/StatCard';
import PageLoader from '../../components/common/PageLoader';
import './StudentProgressPage.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const done = status === 'completed';
  return (
    <span className={`sp-conv__status sp-conv__status--${done ? 'done' : 'active'}`}>
      {done ? 'Completed' : 'Active'}
    </span>
  );
}

function StudentProgressPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = location.state?.name || `Student #${studentId}`;

  const [progress, setProgress] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getStudentProgress(studentId),
      getStudentConversations(studentId).catch(() => []),
    ])
      .then(([progressData, convsData]) => {
        setProgress(progressData);
        // Expand each conversation into one row per teacher review
        const expanded = (convsData || []).flatMap((conv) => {
          if (!conv.teacherReviews || conv.teacherReviews.length === 0) {
            return [{ ...conv, rowKey: String(conv.conversationId), teacherScore: null, teacherName: null }];
          }
          return conv.teacherReviews.map((r) => ({
            ...conv,
            rowKey: `${conv.conversationId}-${r.teacherId}`,
            teacherScore: r.teacherScore,
            teacherName: r.teacherName,
          }));
        });
        setConversations(expanded);
      })
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

      <h2 className="student-progress__section-title">Conversation History</h2>

      {conversations.length === 0 ? (
        <p className="student-progress__empty">No conversations yet.</p>
      ) : (
        <div className="sp-conv-table-wrap">
          <table className="sp-conv-table">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>AI Score</th>
                <th>Teacher Score</th>
                <th>Reviewed by</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => (
                <tr key={conv.rowKey}>
                  <td className="sp-conv__lesson">
                    {conv.lessonTitle || `Lesson #${conv.lessonId}`}
                  </td>
                  <td className="sp-conv__score">
                    {conv.aiScore != null ? `${conv.aiScore}/100` : '—'}
                  </td>
                  <td className="sp-conv__score">
                    {conv.teacherScore != null ? `${conv.teacherScore}/100` : '—'}
                  </td>
                  <td className="sp-conv__teacher-name">
                    {conv.teacherName || '—'}
                  </td>
                  <td><StatusBadge status={conv.status} /></td>
                  <td className="sp-conv__date">{formatDate(conv.createdAt)}</td>
                  <td>
                    <Link
                      to={`/conversations/${conv.conversationId}`}
                      className="sp-conv__view-btn"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentProgressPage;
