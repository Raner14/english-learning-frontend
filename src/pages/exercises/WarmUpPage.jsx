import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllWarmUpExercises,
  createWarmUpExercise,
  updateWarmUpExercise,
  deleteWarmUpExercise,
} from '../../services/warmUpGrammarService';
import { getAllGrammarRules } from '../../services/grammarService';
import { getAllLessons } from '../../services/lessonService';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import { useToast } from '../../context/ToastContext';
import './WarmUpPage.css';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const TYPES = ['multiple_choice'];

const BLANK_FORM = {
  grammarRuleId: '',
  lessonId: '',
  type: 'multiple_choice',
  difficulty: 'BEGINNER',
  instruction: '',
  content: '',
  options: '',
  correctAnswer: '',
};

function exerciseToForm(ex) {
  return {
    grammarRuleId: ex.grammarRuleId || '',
    lessonId: String(ex.lessonId || ''),
    type: ex.type || 'multiple_choice',
    difficulty: ex.difficulty || 'BEGINNER',
    instruction: ex.instruction || '',
    content: ex.content || '',
    options: (ex.options || []).join(', '),
    correctAnswer: ex.correctAnswer || '',
  };
}

function formToPayload(form) {
  return {
    type: form.type,
    difficulty: form.difficulty,
    instruction: form.instruction.trim(),
    content: form.content.trim(),
    options: form.options.split(',').map((o) => o.trim()).filter(Boolean),
    correctAnswer: form.correctAnswer.trim(),
  };
}

function DifficultyBadge({ value }) {
  return (
    <span className={`warmup-badge warmup-badge--${value?.toLowerCase()}`}>
      {value ? value.charAt(0) + value.slice(1).toLowerCase() : '—'}
    </span>
  );
}

function WarmUpPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [exercises, setExercises] = useState([]);
  const [grammarRules, setGrammarRules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    Promise.all([
      getAllWarmUpExercises(),
      getAllGrammarRules().catch(() => []),
      getAllLessons().catch(() => []),
    ])
      .then(([exercisesData, rulesData, lessonsData]) => {
        setExercises(exercisesData);
        setGrammarRules(rulesData);
        setLessons(lessonsData);
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load exercises.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== 'admin') return <PlaceholderView title="Exercises" />;
  if (loading) return <PageLoader text="Loading exercises…" />;

  const q = searchQuery.trim().toLowerCase();
  const filteredExercises = exercises.filter((ex) => {
    const matchesDifficulty = difficultyFilter === 'All' || ex.difficulty === difficultyFilter;
    const matchesSearch =
      !q ||
      (ex.content || '').toLowerCase().includes(q) ||
      (ex.instruction || '').toLowerCase().includes(q) ||
      (ex.grammarRuleId || '').toLowerCase().includes(q);
    return matchesDifficulty && matchesSearch;
  });

  function handleAddClick() {
    setEditExercise(null);
    setForm(BLANK_FORM);
    setFormError('');
    setShowForm(true);
  }

  function handleEditClick(ex) {
    setEditExercise(ex);
    setForm(exerciseToForm(ex));
    setFormError('');
    setConfirmId(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditExercise(null);
    setFormError('');
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!editExercise && !form.grammarRuleId.trim()) { setFormError('Grammar Rule ID is required.'); return; }
    if (!editExercise && !form.lessonId) { setFormError('Lesson ID is required.'); return; }
    if (!form.instruction.trim()) { setFormError('Instruction is required.'); return; }
    if (!form.content.trim()) { setFormError('Content is required.'); return; }
    const optionList = form.options.split(',').map((o) => o.trim()).filter(Boolean);
    if (optionList.length < 2) { setFormError('At least 2 options are required (comma-separated).'); return; }
    if (!form.correctAnswer.trim()) { setFormError('Correct answer is required.'); return; }
    if (!optionList.includes(form.correctAnswer.trim())) {
      setFormError('Correct answer must exactly match one of the options.');
      return;
    }

    setFormSaving(true);
    setFormError('');
    const payload = formToPayload(form);

    try {
      if (editExercise) {
        await updateWarmUpExercise(editExercise.exerciseId, payload);
        setExercises((prev) =>
          prev.map((ex) =>
            ex.exerciseId === editExercise.exerciseId ? { ...ex, ...payload } : ex
          )
        );
        toast('Exercise updated.');
      } else {
        const result = await createWarmUpExercise({
          grammarRuleId: form.grammarRuleId.trim(),
          lessonId: Number(form.lessonId),
          ...payload,
        });
        setExercises((prev) => [
          ...prev,
          {
            exerciseId: result.exerciseId,
            grammarRuleId: form.grammarRuleId.trim(),
            lessonId: Number(form.lessonId),
            ...payload,
          },
        ]);
        toast('Exercise created.');
      }
      setShowForm(false);
      setEditExercise(null);
    } catch (err) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save exercise.');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(exerciseId) {
    setDeletingId(exerciseId);
    setConfirmId(null);
    try {
      await deleteWarmUpExercise(exerciseId);
      setExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseId));
      toast('Exercise deleted.');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete exercise.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="warmup-page">
      <div className="warmup-page__header">
        <h1 className="warmup-page__title">Warm-Up Exercises</h1>
        <span className="warmup-page__count">{exercises.length} exercises</span>
        {!showForm && (
          <button type="button" className="warmup-page__add-btn" onClick={handleAddClick}>
            + Add Exercise
          </button>
        )}
      </div>

      {error && <p className="warmup-page__error">{error}</p>}

      {/* Create / Edit form panel */}
      {showForm && (
        <form className="warmup-form" onSubmit={handleFormSubmit} noValidate>
          <h2 className="warmup-form__title">
            {editExercise ? `Edit Exercise #${editExercise.exerciseId}` : 'New Exercise'}
          </h2>

          <div className="warmup-form__grid">
            {/* Create-only: grammarRuleId + lessonId */}
            {!editExercise && (
              <>
                <div className="warmup-form__field warmup-form__field--half">
                  <label className="warmup-form__label">Grammar Rule *</label>
                  {grammarRules.length > 0 ? (
                    <select
                      name="grammarRuleId"
                      className="warmup-form__select"
                      value={form.grammarRuleId}
                      onChange={handleFormChange}
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
                      name="grammarRuleId"
                      className="warmup-form__input"
                      placeholder="e.g. present_simple"
                      value={form.grammarRuleId}
                      onChange={handleFormChange}
                    />
                  )}
                </div>
                <div className="warmup-form__field warmup-form__field--half">
                  <label className="warmup-form__label">Lesson *</label>
                  {lessons.length > 0 ? (
                    <select
                      name="lessonId"
                      className="warmup-form__select"
                      value={form.lessonId}
                      onChange={handleFormChange}
                    >
                      <option value="">— select a lesson —</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.lessonId} value={String(lesson.lessonId)}>
                          #{lesson.lessonId} — {lesson.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="lessonId"
                      type="number"
                      min="1"
                      className="warmup-form__input"
                      placeholder="e.g. 101"
                      value={form.lessonId}
                      onChange={handleFormChange}
                    />
                  )}
                </div>
              </>
            )}

            <div className="warmup-form__field warmup-form__field--half">
              <label className="warmup-form__label">Type</label>
              <select
                name="type"
                className="warmup-form__select"
                value={form.type}
                onChange={handleFormChange}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="warmup-form__field warmup-form__field--half">
              <label className="warmup-form__label">Difficulty</label>
              <select
                name="difficulty"
                className="warmup-form__select"
                value={form.difficulty}
                onChange={handleFormChange}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="warmup-form__field warmup-form__field--full">
              <label className="warmup-form__label">Instruction *</label>
              <input
                name="instruction"
                className="warmup-form__input"
                placeholder="e.g. Choose the correct answer"
                value={form.instruction}
                onChange={handleFormChange}
              />
            </div>

            <div className="warmup-form__field warmup-form__field--full">
              <label className="warmup-form__label">Content *</label>
              <textarea
                name="content"
                className="warmup-form__textarea"
                rows={2}
                placeholder="e.g. How often ____ you update the server?"
                value={form.content}
                onChange={handleFormChange}
              />
              <span className="warmup-form__hint">Use ____ to mark the blank</span>
            </div>

            <div className="warmup-form__field warmup-form__field--full">
              <label className="warmup-form__label">Options *</label>
              <input
                name="options"
                className="warmup-form__input"
                placeholder="e.g. do, does, is, are"
                value={form.options}
                onChange={handleFormChange}
              />
              <span className="warmup-form__hint">Comma-separated, at least 2</span>
            </div>

            <div className="warmup-form__field warmup-form__field--half">
              <label className="warmup-form__label">Correct Answer *</label>
              <input
                name="correctAnswer"
                className="warmup-form__input"
                placeholder="Must match one of the options exactly"
                value={form.correctAnswer}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {formError && <p className="warmup-form__error">{formError}</p>}

          <div className="warmup-form__actions">
            <button type="submit" className="warmup-form__submit-btn" disabled={formSaving}>
              {formSaving ? 'Saving…' : editExercise ? 'Save Changes' : 'Create Exercise'}
            </button>
            <button
              type="button"
              className="warmup-form__cancel-btn"
              onClick={handleCancel}
              disabled={formSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search + difficulty filter bar */}
      {!showForm && (
        <div className="warmup-filter-bar">
          <input
            type="search"
            className="warmup-filter-bar__search"
            placeholder="Search by content, instruction or grammar rule…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="warmup-filter-bar__difficulties" role="group" aria-label="Filter by difficulty">
            {['All', ...DIFFICULTIES].map((d) => (
              <button
                key={d}
                type="button"
                className={`warmup-filter-bar__diff-btn warmup-filter-bar__diff-btn--${d.toLowerCase()}${difficultyFilter === d ? ' warmup-filter-bar__diff-btn--active' : ''}`}
                onClick={() => setDifficultyFilter(d)}
              >
                {d === 'All' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {(searchQuery || difficultyFilter !== 'All') && (
            <span className="warmup-filter-bar__count">
              {filteredExercises.length} of {exercises.length}
            </span>
          )}
        </div>
      )}

      {/* Exercises table */}
      <div className="warmup-table-wrap">
        <table className="warmup-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lesson</th>
              <th>Grammar Rule</th>
              <th>Content</th>
              <th>Difficulty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExercises.length === 0 ? (
              <tr>
                <td colSpan={6} className="warmup-table__empty">
                  {searchQuery || difficultyFilter !== 'All'
                    ? 'No exercises match your search.'
                    : 'No exercises found.'}
                </td>
              </tr>
            ) : (
              filteredExercises.map((ex) => (
                <tr
                  key={ex.exerciseId}
                  className={deletingId === ex.exerciseId ? 'warmup-table__row--deleting' : ''}
                >
                  <td className="warmup-table__id">{ex.exerciseId}</td>
                  <td className="warmup-table__lesson">{ex.lessonId}</td>
                  <td className="warmup-table__rule">
                    {ex.grammarRuleId?.replace(/_/g, ' ')}
                  </td>
                  <td className="warmup-table__content" title={ex.content}>
                    {ex.content?.length > 55 ? ex.content.slice(0, 52) + '…' : ex.content}
                  </td>
                  <td><DifficultyBadge value={ex.difficulty} /></td>
                  <td className="warmup-table__actions">
                    {confirmId === ex.exerciseId ? (
                      <span className="warmup-table__btn-group">
                        <button
                          type="button"
                          className="warmup-table__btn warmup-table__btn--confirm"
                          onClick={() => handleDelete(ex.exerciseId)}
                          disabled={deletingId === ex.exerciseId}
                        >
                          {deletingId === ex.exerciseId ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="warmup-table__btn warmup-table__btn--cancel"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="warmup-table__btn-group">
                        <button
                          type="button"
                          className="warmup-table__btn warmup-table__btn--edit"
                          onClick={() => handleEditClick(ex)}
                          disabled={!!deletingId}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="warmup-table__btn warmup-table__btn--delete"
                          onClick={() => setConfirmId(ex.exerciseId)}
                          disabled={!!deletingId}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WarmUpPage;
