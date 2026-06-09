import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listConversations } from '../../services/conversationService';
import { getMyStudents } from '../../services/relationsService';
import { getAllLessons } from '../../services/lessonService';
import DataTable from '../../components/tables/DataTable';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './ConversationsPage.css';

function ScorePill({ value }) {
  if (value == null) return <span className="score-pill score-pill--none">—</span>;
  const cls = value >= 80 ? 'score-pill--high' : value >= 60 ? 'score-pill--mid' : 'score-pill--low';
  return <span className={`score-pill ${cls}`}>{value}</span>;
}

function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [lessonMap, setLessonMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'teacher') return;
    Promise.all([
      listConversations({ status: 'completed' }),
      getMyStudents(),
      getAllLessons(),
    ])
      .then(([convs, students, lessons]) => {
        setConversations(convs);

        const sMap = {};
        students.forEach((s) => {
          sMap[s.studentId] = `${s.firstName} ${s.lastName}`;
        });
        setStudentMap(sMap);

        const lMap = {};
        lessons.forEach((l) => {
          lMap[l.lessonId] = l.title;
        });
        setLessonMap(lMap);
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load conversations.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== 'teacher') return <PlaceholderView title="Student Conversations" />;
  if (loading) return <PageLoader text="Loading conversations..." />;

  const unreviewedCount = conversations.filter((c) => !c.isReviewedByTeacher).length;
  const displayed = filter === 'unreviewed'
    ? conversations.filter((c) => !c.isReviewedByTeacher)
    : conversations;

  const COLUMNS = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => studentMap[row.studentId] || `Student #${row.studentId}`,
    },
    {
      key: 'lesson',
      label: 'Lesson',
      render: (_, row) => lessonMap[row.lessonId] || `Lesson #${row.lessonId}`,
    },
    {
      key: 'aiScore',
      label: 'AI Score',
      render: (v) => <ScorePill value={v} />,
    },
    {
      key: 'reviewStatus',
      label: 'Status',
      render: (_, row) =>
        row.isReviewedByTeacher ? (
          <span className="review-badge review-badge--done">Reviewed</span>
        ) : (
          <span className="review-badge review-badge--pending">Needs Review</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Link
          to={`/conversations/${row.conversationId}`}
          className="conversations-page__action-link"
        >
          {row.isReviewedByTeacher ? 'View' : 'Review'}
        </Link>
      ),
    },
  ];

  return (
    <div className="conversations-page">
      <div className="conversations-page__header">
        <h1 className="conversations-page__title">Student Conversations</h1>
        <div className="conversations-page__filters">
          <button
            type="button"
            className={`conversations-page__filter-btn${filter === 'all' ? ' conversations-page__filter-btn--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({conversations.length})
          </button>
          <button
            type="button"
            className={`conversations-page__filter-btn${filter === 'unreviewed' ? ' conversations-page__filter-btn--active' : ''}`}
            onClick={() => setFilter('unreviewed')}
          >
            Needs Review ({unreviewedCount})
          </button>
        </div>
      </div>

      {error && <p className="conversations-page__error">{error}</p>}

      <DataTable
        columns={COLUMNS}
        data={displayed.map((c) => ({ ...c, id: c.conversationId }))}
        emptyMessage={
          filter === 'unreviewed'
            ? 'All conversations have been reviewed.'
            : 'No completed conversations yet.'
        }
      />
    </div>
  );
}

export default ConversationsPage;
