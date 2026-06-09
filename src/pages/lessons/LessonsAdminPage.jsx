import { useState, useEffect } from 'react';
import { getAllLessons, deleteLesson } from '../../services/lessonService';
import PageLoader from '../../components/common/PageLoader';
import './LessonsAdminPage.css';

const LEVEL_CLASS = {
  Beginner: 'lessons-admin__level--beginner',
  Intermediate: 'lessons-admin__level--intermediate',
  Advanced: 'lessons-admin__level--advanced',
};

function LessonsAdminPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load lessons.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(lessonId) {
    setDeletingId(lessonId);
    setConfirmId(null);
    try {
      await deleteLesson(lessonId);
      setLessons((prev) => prev.filter((l) => l.lessonId !== lessonId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete lesson.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageLoader text="Loading lessons..." />;

  return (
    <div className="lessons-admin">
      <div className="lessons-admin__header">
        <h1 className="lessons-admin__title">Manage Lessons</h1>
        <span className="lessons-admin__count">{lessons.length} lessons</span>
      </div>

      {error && <p className="lessons-admin__error">{error}</p>}

      <div className="lessons-admin-table-wrap">
        <table className="lessons-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Level</th>
              <th>Grammar Rule</th>
              <th>Locked</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr
                key={lesson.lessonId}
                className={deletingId === lesson.lessonId ? 'lessons-admin-table__row--deleting' : ''}
              >
                <td className="lessons-admin-table__id">{lesson.lessonId}</td>
                <td className="lessons-admin-table__title">{lesson.title}</td>
                <td>
                  <span className={`lessons-admin__level ${LEVEL_CLASS[lesson.level] || ''}`}>
                    {lesson.level}
                  </span>
                </td>
                <td className="lessons-admin-table__grammar">{lesson.grammarRuleId}</td>
                <td>
                  <span className={`lessons-admin__locked ${lesson.locked ? 'lessons-admin__locked--yes' : 'lessons-admin__locked--no'}`}>
                    {lesson.locked ? 'Locked' : 'Open'}
                  </span>
                </td>
                <td className="lessons-admin-table__actions">
                  {confirmId === lesson.lessonId ? (
                    <span className="lessons-admin-table__confirm">
                      <span className="lessons-admin-table__confirm-label">Delete?</span>
                      <button
                        type="button"
                        className="lessons-admin-table__btn lessons-admin-table__btn--danger"
                        onClick={() => handleDelete(lesson.lessonId)}
                        disabled={deletingId === lesson.lessonId}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="lessons-admin-table__btn lessons-admin-table__btn--cancel"
                        onClick={() => setConfirmId(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="lessons-admin-table__btn lessons-admin-table__btn--delete"
                      onClick={() => setConfirmId(lesson.lessonId)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === lesson.lessonId ? 'Deleting…' : 'Delete'}
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

export default LessonsAdminPage;
