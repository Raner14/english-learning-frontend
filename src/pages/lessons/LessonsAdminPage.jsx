import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllLessons,
  createLesson,
  createLessonVocabItem,
  updateLesson,
  deleteLesson,
} from '../../services/lessonService';
import { getAllGrammarRules } from '../../services/grammarService';
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../context/ToastContext';
import './LessonsAdminPage.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_CLASS = {
  Beginner: 'lessons-admin__level--beginner',
  Intermediate: 'lessons-admin__level--intermediate',
  Advanced: 'lessons-admin__level--advanced',
};

const BLANK_VOCAB_WORD = {
  word: '',
  translation: '',
  definition: '',
  example: '',
  completeSentence: '',
};

const BLANK_FORM = {
  title: '',
  scene: '',
  aiRole: '',
  level: 'Beginner',
  grammarRuleId: '',
  vocabWords: [{ ...BLANK_VOCAB_WORD }],
};

function lessonToForm(lesson) {
  return {
    title: lesson.title || '',
    scene: lesson.scene || '',
    aiRole: lesson.aiRole || '',
    level: lesson.level || 'Beginner',
    grammarRuleId: lesson.grammarRuleId || '',
  };
}

function LessonsAdminPage() {
  const toast = useToast();
  const [lessons, setLessons] = useState([]);
  const [grammarRules, setGrammarRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllLessons(),
      getAllGrammarRules().catch(() => []),
    ])
      .then(([lessonsData, rulesData]) => {
        setLessons(lessonsData);
        setGrammarRules(rulesData);
      })
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

  function addVocabWord() {
    setFormData((prev) => ({
      ...prev,
      vocabWords: [...prev.vocabWords, { ...BLANK_VOCAB_WORD }],
    }));
  }

  function removeVocabWord(i) {
    setFormData((prev) => ({
      ...prev,
      vocabWords: prev.vocabWords.filter((_, idx) => idx !== i),
    }));
  }

  function handleVocabWordChange(i, field, value) {
    setFormData((prev) => ({
      ...prev,
      vocabWords: prev.vocabWords.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)),
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!editLesson) {
      const filled = formData.vocabWords.filter((w) => w.word.trim());
      if (filled.length === 0) {
        setFormError('Please add at least one vocabulary word.');
        return;
      }
      const incomplete = filled.find(
        (w) =>
          !w.translation.trim() ||
          !w.definition.trim() ||
          !w.example.trim() ||
          !w.completeSentence.trim()
      );
      if (incomplete) {
        setFormError(`All 5 fields are required for the word "${incomplete.word}".`);
        return;
      }
    }

    setSubmitting(true);

    const lessonPayload = {
      title: formData.title,
      scene: formData.scene,
      aiRole: formData.aiRole,
      level: formData.level,
      grammarRuleId: formData.grammarRuleId,
      vocabularyId: editLesson ? editLesson.vocabularyId : 0,
    };

    try {
      if (editLesson) {
        await updateLesson(editLesson.lessonId, lessonPayload);
        setLessons((prev) =>
          prev.map((l) =>
            l.lessonId === editLesson.lessonId ? { ...l, ...lessonPayload } : l
          )
        );
        toast('Lesson updated.');
        closeForm();
      } else {
        const created = await createLesson(lessonPayload);
        setLessons((prev) => [...prev, created]);

        const words = formData.vocabWords.filter((w) => w.word.trim());
        let vocabFailed = false;
        for (const w of words) {
          try {
            await createLessonVocabItem(created.lessonId, {
              word: w.word.trim(),
              translation: w.translation.trim(),
              definition: w.definition.trim(),
              example: w.example.trim(),
              completeSentence: w.completeSentence.trim(),
            });
          } catch {
            vocabFailed = true;
            break;
          }
        }

        if (vocabFailed) {
          toast(`Lesson #${created.lessonId} created. Some words failed — add them from the Vocab page.`);
        } else {
          toast(`Lesson #${created.lessonId} created with ${words.length} vocabulary word${words.length !== 1 ? 's' : ''}.`);
        }
        closeForm();
      }
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
      toast('Lesson deleted.');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete lesson.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageLoader text="Loading lessons..." />;

  const q = searchQuery.trim().toLowerCase();
  const filteredLessons = lessons.filter((l) => {
    const matchesLevel = levelFilter === 'All' || l.level === levelFilter;
    const matchesSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      (l.grammarRuleId || '').toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

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

          {/* ── Lesson details ── */}
          <p className="lessons-admin__section-title">Lesson Details</p>
          <div className="lessons-admin__form-grid">
            <div className="lessons-admin__field">
              <label className="lessons-admin__label">Title</label>
              <input
                type="text"
                className="lessons-admin__input"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g. The Technical Interview"
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
                placeholder="e.g. Technical Team Lead"
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
              <label className="lessons-admin__label">Grammar Rule</label>
              {grammarRules.length > 0 ? (
                <select
                  className="lessons-admin__input lessons-admin__select"
                  value={formData.grammarRuleId}
                  onChange={(e) => handleFieldChange('grammarRuleId', e.target.value)}
                  required
                >
                  <option value="">— select a rule —</option>
                  {grammarRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.category} · {rule.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="lessons-admin__input"
                  value={formData.grammarRuleId}
                  onChange={(e) => handleFieldChange('grammarRuleId', e.target.value)}
                  placeholder="e.g. present_simple"
                  required
                />
              )}
            </div>

            <div className="lessons-admin__field lessons-admin__field--full">
              <label className="lessons-admin__label">Scene</label>
              <textarea
                className="lessons-admin__textarea"
                value={formData.scene}
                onChange={(e) => handleFieldChange('scene', e.target.value)}
                rows={3}
                placeholder="Describe the conversation scenario the student will practice in…"
                required
                maxLength={400}
              />
            </div>
          </div>

          {/* ── Vocabulary section (create only) ── */}
          {!editLesson && (
            <>
              <div className="lessons-admin__section-divider">
                <p className="lessons-admin__section-title">Vocabulary Words</p>
                <p className="lessons-admin__section-hint">
                  Add the words students will study in this lesson. At least one word is required.
                  Each word needs all five fields.
                </p>
              </div>

              {formData.vocabWords.map((word, i) => (
                <div key={i} className="lessons-admin__vocab-card">
                  <div className="lessons-admin__vocab-card-header">
                    <span className="lessons-admin__vocab-num">Word {i + 1}</span>
                    {formData.vocabWords.length > 1 && (
                      <button
                        type="button"
                        className="lessons-admin__vocab-remove"
                        onClick={() => removeVocabWord(i)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="lessons-admin__form-grid">
                    <div className="lessons-admin__field">
                      <label className="lessons-admin__label">Word</label>
                      <input
                        type="text"
                        className="lessons-admin__input"
                        value={word.word}
                        onChange={(e) => handleVocabWordChange(i, 'word', e.target.value)}
                        placeholder="e.g. negotiate"
                      />
                    </div>
                    <div className="lessons-admin__field">
                      <label className="lessons-admin__label">Translation (Hebrew)</label>
                      <input
                        type="text"
                        className="lessons-admin__input"
                        value={word.translation}
                        onChange={(e) => handleVocabWordChange(i, 'translation', e.target.value)}
                        placeholder="e.g. לנהל משא ומתן"
                      />
                    </div>
                    <div className="lessons-admin__field lessons-admin__field--full">
                      <label className="lessons-admin__label">Definition</label>
                      <input
                        type="text"
                        className="lessons-admin__input"
                        value={word.definition}
                        onChange={(e) => handleVocabWordChange(i, 'definition', e.target.value)}
                        placeholder="A brief definition of the word in English"
                      />
                    </div>
                    <div className="lessons-admin__field lessons-admin__field--full">
                      <label className="lessons-admin__label">Example sentence</label>
                      <input
                        type="text"
                        className="lessons-admin__input"
                        value={word.example}
                        onChange={(e) => handleVocabWordChange(i, 'example', e.target.value)}
                        placeholder="e.g. We negotiated a new deal with the client."
                      />
                    </div>
                    <div className="lessons-admin__field lessons-admin__field--full">
                      <label className="lessons-admin__label">
                        Complete sentence — use <code>________</code> (8 underscores) for the blank
                      </label>
                      <input
                        type="text"
                        className="lessons-admin__input"
                        value={word.completeSentence}
                        onChange={(e) => handleVocabWordChange(i, 'completeSentence', e.target.value)}
                        placeholder="e.g. We ________ a new deal with the client."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="lessons-admin__vocab-add"
                onClick={addVocabWord}
              >
                + Add Another Word
              </button>

              <div className="lessons-admin__warmup-note">
                <strong>Grammar Warmup:</strong> Warmup exercises are shared by grammar rule. If the
                rule you selected already has exercises, students will see them automatically. If you
                created a brand-new rule, add its exercises later via the{' '}
                <Link to="/exercises">Warm-Up Exercises</Link> page.
              </div>
            </>
          )}

          {/* ── Edit mode: vocab managed separately ── */}
          {editLesson && (
            <div className="lessons-admin__vocab-note">
              <strong>Vocabulary</strong> — to add, edit, or remove words for this lesson, use the{' '}
              <Link to={`/lessons/${editLesson.lessonId}/vocab`}>Vocabulary page</Link>.
            </div>
          )}

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

      {/* Search + level filter bar */}
      {!showForm && (
        <div className="lessons-admin-filter-bar">
          <input
            type="search"
            className="lessons-admin-filter-bar__search"
            placeholder="Search by title or grammar rule…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="lessons-admin-filter-bar__levels" role="group" aria-label="Filter by level">
            {['All', ...LEVELS].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`lessons-admin-filter-bar__level-btn${levelFilter === lvl ? ' lessons-admin-filter-bar__level-btn--active' : ''}`}
                onClick={() => setLevelFilter(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
          {(searchQuery || levelFilter !== 'All') && (
            <span className="lessons-admin-filter-bar__count">
              {filteredLessons.length} of {lessons.length}
            </span>
          )}
        </div>
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
            {filteredLessons.length === 0 && (
              <tr>
                <td colSpan={6} className="lessons-admin-table__empty">
                  No lessons match your search.
                </td>
              </tr>
            )}
            {filteredLessons.map((lesson) => (
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
                      <Link
                        to={`/lessons/${lesson.lessonId}/vocab`}
                        className="lessons-admin-table__btn lessons-admin-table__btn--vocab"
                      >
                        Vocab
                      </Link>
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
