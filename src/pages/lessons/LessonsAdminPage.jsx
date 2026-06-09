import { useState, useEffect } from 'react';
import { getAllLessons, createLesson, updateLesson, deleteLesson } from '../../services/lessonService';
import PageLoader from '../../components/common/PageLoader';
import './LessonsAdminPage.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_CLASS = {
  Beginner: 'lessons-admin__level--beginner',
  Intermediate: 'lessons-admin__level--intermediate',
  Advanced: 'lessons-admin__level--advanced',
};

const BLANK_FORM = {
  title: '',
  scene: '',
  aiRole: '',
  level: 'Beginner',
  grammarRuleId: '',
  vocabularyId: '',
};

function lessonToForm(lesson) {
  return {
    title: lesson.title || '',
    scene: lesson.scene || '',
    aiRole: lesson.aiRole || '',
    level: lesson.level || 'Beginner',
    grammarRuleId: lesson.grammarRuleId || '',
    vocabularyId: lesson.vocabularyId !== undefined ? String(lesson.vocabularyId) : '',
  };
}

function LessonsAdminPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editLesson, setEditLesson] = useState(null); // null = create, object = edit
  const [formData, setFormData] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load lessons.'))
      .finally(() => setLoading(false));
  }, []);

  function openCreateForm() {
    setEditLesson(null);
    setFormData(BLANK_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(lesson) {
    setEditLesson(lesson);
    setFormData(lessonToForm(lesson));
    setFormError('');
    setConfirmId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditLesson(null);
    setFormData(BLANK_FORM);
    setFormError('');
  }

  function handleFieldChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = {
      ...formData,
      vocabularyId: Number(formData.vocabularyId),
    };

    try {
      if (editLesson) {
        await updateLesson(editLesson.lessonId, payload);
        // PUT only returns { lessonId }, so reconstruct the updated row locally
        setLessons((prev) =>
          prev.map((l) =>
            l.lessonId === editLesson.lessonId ? { ...l, ...payload } : l
          )
        );
      } else {
        const created = await createLesson(payload);
        setLessons((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save lesson.');
    } finally {
      setSubmitting(false);
    }
  }

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
        <button
          type="button"
          className="lessons-admin__add-btn"
          onClick={openCreateForm}
          disabled={showForm && !editLesson}
        >
          + Add Lesson
        </button>
      </div>

      {error && <p className="lessons-admin__error">{error}</p>}

      {/* Create / Edit form panel */}
      {showForm && (
        <form className="lessons-admin__form" onSubmit={handleFormSubmit} noValidate>
          <h2 className="lessons-admin__form-title">
            {editLesson ? `Edit Lesson #${editLesson.lessonId}` : 'New Lesson'}
          </h2>

          <div className="lessons-admin__form-grid">
            <div className="lessons-admin__field">
              <label className="lessons-admin__label">Title</label>
              <input
                type="text"
                className="lessons-admin__input"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="lessons-admin__field">
              <label className="lessons-admin__label">AI Role</label>
              <input
                type="text"
                className="lessons-admin__input"
                value={formData.aiRole}
                onChange={(e) => handleFieldChange('aiRole', e.target.value)}
                required
                maxLength={80}
              />
            </div>

            <div className="lessons-admin__field">
              <label className="lessons-admin__label">Level</label>
              <select
                className="lessons-admin__input lessons-admin__select"
                value={formData.level}
                onChange={(e) => handleFieldChange('level', e.target.value)}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div className="lessons-admin__field">
              <label className="lessons-admin__label">Grammar Rule ID</label>
              <input
                type="text"
                className="lessons-admin__input"
                value={formData.grammarRuleId}
                onChange={(e) => handleFieldChange('grammarRuleId', e.target.value)}
                placeholder="e.g. present_simple"
                required
              />
            </div>

            <div className="lessons-admin__field">
              <label className="lessons-admin__label">Vocabulary ID</label>
              <input
                type="number"
                className="lessons-admin__input"
                value={formData.vocabularyId}
                onChange={(e) => handleFieldChange('vocabularyId', e.target.value)}
                min={1}
                required
              />
            </div>

            <div className="lessons-admin__field lessons-admin__field--full">
              <label className="lessons-admin__label">Scene</label>
              <textarea
                className="lessons-admin__textarea"
                value={formData.scene}
                onChange={(e) => handleFieldChange('scene', e.target.value)}
                rows={3}
                required
                maxLength={400}
              />
            </div>
          </div>

          {formError && <p className="lessons-admin__form-error">{formError}</p>}

          <div className="lessons-admin__form-actions">
            <button
              type="submit"
              className="lessons-admin__submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : editLesson ? 'Save Changes' : 'Create Lesson'}
            </button>
            <button
              type="button"
              className="lessons-admin__cancel-btn"
              onClick={closeForm}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
                    <span className="lessons-admin-table__action-group">
                      <button
                        type="button"
                        className="lessons-admin-table__btn lessons-admin-table__btn--edit"
                        onClick={() => openEditForm(lesson)}
                        disabled={deletingId !== null}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="lessons-admin-table__btn lessons-admin-table__btn--delete"
                        onClick={() => setConfirmId(lesson.lessonId)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === lesson.lessonId ? 'Deleting…' : 'Delete'}
                      </button>
                    </span>
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
