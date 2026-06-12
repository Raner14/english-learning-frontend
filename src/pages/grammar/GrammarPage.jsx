import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllGrammarRules,
  getGrammarRule,
  createGrammarRule,
  updateGrammarRule,
  deleteGrammarRule,
} from '../../services/grammarService';
import { createWarmUpExercise } from '../../services/warmUpGrammarService';
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../context/ToastContext';
import PlaceholderView from '../../components/common/PlaceholderView';
import './GrammarPage.css';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const BLANK_FORM = {
  id: '',
  category: '',
  usage: '',
  formulaGeneral: '',
  formulaPositive: '',
  formulaNegative: '',
  formulaQuestion: '',
  spellingRules: '',
  keywords: '',
  examples: '[]',
};

const BLANK_WARMUP = {
  instruction: '',
  content: '',
  options: '',
  correctAnswer: '',
  difficulty: 'BEGINNER',
};

function ruleToForm(rule) {
  return {
    id: rule.id,
    category: rule.category || '',
    usage: rule.usage || '',
    formulaGeneral: rule.forms?.general_formula || '',
    formulaPositive: rule.forms?.positive || '',
    formulaNegative: rule.forms?.negative || '',
    formulaQuestion: rule.forms?.question || '',
    spellingRules: typeof rule.spellingRules === 'string' ? rule.spellingRules : '',
    keywords: (rule.keywords || []).join(', '),
    examples: JSON.stringify(rule.examples || [], null, 2),
  };
}

function formToPayload(form) {
  let examples = [];
  try { examples = JSON.parse(form.examples); } catch { examples = []; }
  return {
    category: form.category.trim(),
    usage: form.usage.trim(),
    forms: {
      general_formula: form.formulaGeneral.trim(),
      positive: form.formulaPositive.trim(),
      negative: form.formulaNegative.trim(),
      question: form.formulaQuestion.trim(),
    },
    spellingRules: form.spellingRules.trim(),
    keywords: form.keywords.trim()
      ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
    examples,
  };
}

function GrammarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [warmupExercises, setWarmupExercises] = useState([{ ...BLANK_WARMUP }]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    getAllGrammarRules()
      .then(setRules)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load grammar rules.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== 'admin') return <PlaceholderView title="Grammar Rules" />;
  if (loading) return <PageLoader text="Loading grammar rules…" />;

  const q = searchQuery.trim().toLowerCase();
  const filteredRules = q
    ? rules.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.usage || '').toLowerCase().includes(q)
      )
    : rules;

  function handleAddClick() {
    setEditRule(null);
    setForm(BLANK_FORM);
    setWarmupExercises([{ ...BLANK_WARMUP }]);
    setFormError('');
    setShowForm(true);
  }

  async function handleEditClick(rule) {
    setEditLoading(true);
    setFormError('');
    try {
      const full = await getGrammarRule(rule.id);
      setEditRule(full);
      setForm(ruleToForm(full));
      setWarmupExercises([{ ...BLANK_WARMUP }]);
      setShowForm(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to load rule for editing.');
    } finally {
      setEditLoading(false);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditRule(null);
    setFormError('');
    setWarmupExercises([{ ...BLANK_WARMUP }]);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addWarmupExercise() {
    setWarmupExercises((prev) => [...prev, { ...BLANK_WARMUP }]);
  }

  function removeWarmupExercise(index) {
    setWarmupExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function handleWarmupChange(index, field, value) {
    setWarmupExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!editRule && !form.id.trim()) { setFormError('Rule ID is required.'); return; }
    if (!form.category.trim()) { setFormError('Category is required.'); return; }
    if (!form.usage.trim()) { setFormError('Usage is required.'); return; }
    if (!form.formulaGeneral.trim()) { setFormError('General formula is required.'); return; }

    // Validate any exercise cards that have been partially filled (create mode only)
    if (!editRule) {
      const startedExercises = warmupExercises.filter(
        (ex) => ex.instruction.trim() || ex.content.trim() || ex.options.trim() || ex.correctAnswer.trim()
      );
      for (const ex of startedExercises) {
        const optionList = ex.options.split(',').map((o) => o.trim()).filter(Boolean);
        if (!ex.instruction.trim()) { setFormError('Each started exercise requires an instruction.'); return; }
        if (!ex.content.trim()) { setFormError('Each started exercise requires question content.'); return; }
        if (optionList.length < 2) { setFormError('Each exercise needs at least 2 options (comma-separated).'); return; }
        if (!ex.correctAnswer.trim()) { setFormError('Each started exercise requires a correct answer.'); return; }
        if (!optionList.includes(ex.correctAnswer.trim())) {
          setFormError('Correct answer must exactly match one of the options.');
          return;
        }
      }
    }

    setFormSaving(true);
    setFormError('');
    try {
      const payload = formToPayload(form);
      if (editRule) {
        await updateGrammarRule(editRule.id, payload);
        setRules((prev) =>
          prev.map((r) =>
            r.id === editRule.id
              ? { ...r, category: payload.category, usage: payload.usage, forms: { general_formula: payload.forms.general_formula } }
              : r
          )
        );
        toast('Grammar rule updated.');
      } else {
        const ruleId = form.id.trim();
        await createGrammarRule({ id: ruleId, ...payload });
        setRules((prev) => [
          ...prev,
          {
            id: ruleId,
            category: payload.category,
            usage: payload.usage,
            forms: { general_formula: payload.forms.general_formula },
          },
        ]);

        // Create any warmup exercise cards that have content
        const toCreate = warmupExercises.filter(
          (ex) => ex.instruction.trim() && ex.content.trim()
        );
        if (toCreate.length > 0) {
          let saved = 0;
          for (const ex of toCreate) {
            try {
              await createWarmUpExercise({
                grammarRuleId: ruleId,
                lessonId: 0,
                type: 'multiple_choice',
                instruction: ex.instruction.trim(),
                content: ex.content.trim(),
                options: ex.options.split(',').map((o) => o.trim()).filter(Boolean),
                correctAnswer: ex.correctAnswer.trim(),
                difficulty: ex.difficulty,
              });
              saved++;
            } catch {
              // continue saving remaining exercises
            }
          }
          if (saved === toCreate.length) {
            toast(`Grammar rule created with ${saved} warmup exercise${saved > 1 ? 's' : ''}.`);
          } else {
            toast(`Grammar rule created. ${saved}/${toCreate.length} exercises saved — add the rest from the Exercises page.`);
          }
        } else {
          toast('Grammar rule created.');
        }
      }
      setShowForm(false);
      setEditRule(null);
      setWarmupExercises([{ ...BLANK_WARMUP }]);
    } catch (err) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save grammar rule.');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(ruleId) {
    setDeletingId(ruleId);
    setConfirmId(null);
    try {
      await deleteGrammarRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast('Grammar rule deleted.');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete grammar rule.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grammar-page">
      <div className="grammar-page__header">
        <h1 className="grammar-page__title">Grammar Rules</h1>
        {!showForm && (
          <button type="button" className="grammar-page__add-btn" onClick={handleAddClick}>
            + Add Rule
          </button>
        )}
      </div>

      {error && <p className="grammar-page__error">{error}</p>}

      {/* Create / Edit form panel */}
      {showForm && (
        <form className="grammar-form" onSubmit={handleFormSubmit} noValidate>
          <h2 className="grammar-form__title">{editRule ? `Edit: ${editRule.id}` : 'New Grammar Rule'}</h2>

          {/* ── Rule fields ── */}
          <div className="grammar-form__grid">
            {!editRule ? (
              <>
                <div className="grammar-form__field grammar-form__field--half">
                  <label className="grammar-form__label">Rule ID *</label>
                  <input
                    name="id"
                    className="grammar-form__input"
                    placeholder="e.g. past_perfect"
                    value={form.id}
                    onChange={handleFormChange}
                  />
                  <span className="grammar-form__hint">Slug with underscores, e.g. present_simple</span>
                </div>
                <div className="grammar-form__field grammar-form__field--half">
                  <label className="grammar-form__label">Category *</label>
                  <input
                    name="category"
                    className="grammar-form__input"
                    placeholder="e.g. Tenses"
                    value={form.category}
                    onChange={handleFormChange}
                  />
                </div>
              </>
            ) : (
              <div className="grammar-form__field grammar-form__field--half">
                <label className="grammar-form__label">Category *</label>
                <input
                  name="category"
                  className="grammar-form__input"
                  placeholder="e.g. Tenses"
                  value={form.category}
                  onChange={handleFormChange}
                />
              </div>
            )}

            <div className="grammar-form__field grammar-form__field--full">
              <label className="grammar-form__label">Usage *</label>
              <textarea
                name="usage"
                className="grammar-form__textarea"
                rows={2}
                placeholder="Describe when this rule is used…"
                value={form.usage}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">General Formula *</label>
              <input
                name="formulaGeneral"
                className="grammar-form__input"
                placeholder="e.g. Subject + Verb"
                value={form.formulaGeneral}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">Spelling Rules</label>
              <input
                name="spellingRules"
                className="grammar-form__input"
                placeholder="e.g. Verbs ending in -o add -es"
                value={form.spellingRules}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">Positive Form</label>
              <input
                name="formulaPositive"
                className="grammar-form__input"
                placeholder="e.g. Subject + base verb"
                value={form.formulaPositive}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">Negative Form</label>
              <input
                name="formulaNegative"
                className="grammar-form__input"
                placeholder="e.g. Subject + do not + base verb"
                value={form.formulaNegative}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">Question Form</label>
              <input
                name="formulaQuestion"
                className="grammar-form__input"
                placeholder="e.g. Do + Subject + base verb?"
                value={form.formulaQuestion}
                onChange={handleFormChange}
              />
            </div>

            <div className="grammar-form__field grammar-form__field--half">
              <label className="grammar-form__label">Keywords</label>
              <input
                name="keywords"
                className="grammar-form__input"
                placeholder="always, usually, every day"
                value={form.keywords}
                onChange={handleFormChange}
              />
              <span className="grammar-form__hint">Comma-separated</span>
            </div>

            <div className="grammar-form__field grammar-form__field--full">
              <label className="grammar-form__label">Examples (JSON)</label>
              <textarea
                name="examples"
                className="grammar-form__textarea grammar-form__textarea--code"
                rows={4}
                value={form.examples}
                onChange={handleFormChange}
              />
              <span className="grammar-form__hint">
                {'Array of { "text": "...", "type": "positive|negative|question" }'}
              </span>
            </div>
          </div>

          {/* ── Warmup Exercises section ── */}
          {!editRule ? (
            <div className="grammar-form__section-divider">
              <p className="grammar-form__section-title">Warmup Exercises</p>
              <p className="grammar-form__section-hint">
                Add multiple-choice questions for students to practice this rule during the lesson.
                Leave all cards blank to skip — exercises can also be added later from the{' '}
                <Link to="/exercises">Exercises page</Link>.
              </p>

              {warmupExercises.map((ex, i) => (
                <div key={i} className="grammar-form__exercise-card">
                  <div className="grammar-form__exercise-card-header">
                    <span className="grammar-form__exercise-num">Exercise {i + 1}</span>
                    {warmupExercises.length > 1 && (
                      <button
                        type="button"
                        className="grammar-form__exercise-remove"
                        onClick={() => removeWarmupExercise(i)}
                        disabled={formSaving}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grammar-form__exercise-grid">
                    <div className="grammar-form__field grammar-form__field--full">
                      <label className="grammar-form__label">Instruction</label>
                      <input
                        className="grammar-form__input"
                        placeholder="e.g. Choose the correct answer"
                        value={ex.instruction}
                        onChange={(e) => handleWarmupChange(i, 'instruction', e.target.value)}
                      />
                    </div>

                    <div className="grammar-form__field grammar-form__field--full">
                      <label className="grammar-form__label">Question Content</label>
                      <textarea
                        className="grammar-form__textarea"
                        rows={2}
                        placeholder="e.g. She ____ to school every day."
                        value={ex.content}
                        onChange={(e) => handleWarmupChange(i, 'content', e.target.value)}
                      />
                      <span className="grammar-form__hint">Use ____ to mark the blank</span>
                    </div>

                    <div className="grammar-form__field grammar-form__field--full">
                      <label className="grammar-form__label">Options</label>
                      <input
                        className="grammar-form__input"
                        placeholder="e.g. go, goes, going, went"
                        value={ex.options}
                        onChange={(e) => handleWarmupChange(i, 'options', e.target.value)}
                      />
                      <span className="grammar-form__hint">Comma-separated, at least 2</span>
                    </div>

                    <div className="grammar-form__field grammar-form__field--half">
                      <label className="grammar-form__label">Correct Answer</label>
                      <input
                        className="grammar-form__input"
                        placeholder="Must match an option exactly"
                        value={ex.correctAnswer}
                        onChange={(e) => handleWarmupChange(i, 'correctAnswer', e.target.value)}
                      />
                    </div>

                    <div className="grammar-form__field grammar-form__field--half">
                      <label className="grammar-form__label">Difficulty</label>
                      <select
                        className="grammar-form__select"
                        value={ex.difficulty}
                        onChange={(e) => handleWarmupChange(i, 'difficulty', e.target.value)}
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>
                            {d.charAt(0) + d.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="grammar-form__exercise-add"
                onClick={addWarmupExercise}
                disabled={formSaving}
              >
                + Add Another Exercise
              </button>
            </div>
          ) : (
            <div className="grammar-form__warmup-note">
              To add or manage warmup exercises for this rule, go to the{' '}
              <Link to="/exercises">Exercises page</Link> and search for{' '}
              <code>{editRule.id}</code>.
            </div>
          )}

          {formError && <p className="grammar-form__error">{formError}</p>}

          <div className="grammar-form__actions">
            <button type="submit" className="grammar-form__submit-btn" disabled={formSaving}>
              {formSaving ? 'Saving…' : editRule ? 'Save Changes' : 'Create Rule'}
            </button>
            <button
              type="button"
              className="grammar-form__cancel-btn"
              onClick={handleCancel}
              disabled={formSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search bar */}
      {!showForm && (
        <div className="grammar-page__search-bar">
          <input
            type="search"
            className="grammar-page__search-input"
            placeholder="Search by ID, category or usage…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="grammar-page__search-count">
              {filteredRules.length} of {rules.length}
            </span>
          )}
        </div>
      )}

      <div className="grammar-page__table-wrap">
        <table className="grammar-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Category</th>
              <th>Usage</th>
              <th>Formula</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={5} className="grammar-table__empty">
                  {searchQuery ? 'No rules match your search.' : 'No grammar rules found.'}
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="grammar-table__id">{rule.id.replace(/_/g, ' ')}</span>
                  </td>
                  <td>
                    <span className="grammar-table__category">{rule.category}</span>
                  </td>
                  <td className="grammar-table__usage">{rule.usage}</td>
                  <td className="grammar-table__formula">
                    {rule.forms?.general_formula || '—'}
                  </td>
                  <td className="grammar-table__actions">
                    <div className="grammar-table__action-group">
                      {confirmId === rule.id ? (
                        <>
                          <button
                            type="button"
                            className="grammar-table__btn grammar-table__btn--confirm"
                            onClick={() => handleDelete(rule.id)}
                            disabled={deletingId === rule.id}
                          >
                            {deletingId === rule.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            className="grammar-table__btn grammar-table__btn--cancel"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="grammar-table__btn grammar-table__btn--edit"
                            onClick={() => handleEditClick(rule)}
                            disabled={!!deletingId || editLoading}
                          >
                            {editLoading ? '…' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            className="grammar-table__btn grammar-table__btn--delete"
                            onClick={() => setConfirmId(rule.id)}
                            disabled={!!deletingId || editLoading}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
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

export default GrammarPage;
