import { useState, useEffect } from 'react';
import { getMyStudents } from '../../services/relationsService';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './StudentsPage.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const COLUMNS = [
  {
    key: 'name',
    label: 'Student',
    render: (_, row) => `${row.firstName} ${row.lastName}`,
  },
  {
    key: 'currentLevel',
    label: 'Level',
    render: (v) => v || '—',
  },
  {
    key: 'lastActivityDate',
    label: 'Last Active',
    render: (v) => formatDate(v),
  },
];

function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyStudents()
      .then(setStudents)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'teacher') return <PlaceholderView title="My Students" />;
  if (loading) return <PageLoader text="Loading students..." />;

  return (
    <div className="students-page">
      <div className="students-page__header">
        <h1 className="students-page__title">My Students</h1>
        <span className="students-page__count">
          {students.length} active {students.length === 1 ? 'student' : 'students'}
        </span>
      </div>

      {error && <p className="students-page__error">{error}</p>}

      {students.length === 0 && !error ? (
        <div className="students-page__empty">
          <p className="students-page__empty-text">You have no active students yet.</p>
          <p className="students-page__empty-hint">
            Accept student requests from your dashboard to get started.
          </p>
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={students.map((s) => ({ ...s, id: s.studentId }))}
          emptyMessage="No students found."
        />
      )}
    </div>
  );
}

export default StudentsPage;
