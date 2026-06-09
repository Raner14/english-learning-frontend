import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllGrammarRules,
  getGrammarRule,
  createGrammarRule,
  updateGrammarRule,
  deleteGrammarRule,
} from '../../services/grammarService';
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../context/ToastContext';
import PlaceholderView from '../../components/common/PlaceholderView';
import './GrammarPage.css';

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!editRule && !form.id.trim()) { setFormError('Rule ID is required.'); return; }
    if (!form.category.trim()) { setFormError('Category is required.'); return; }
    if (!form.usage.trim()) { setFormError('Usage is required.'); return; }
    if (!form.formulaGeneral.trim()) { setFormError('General formula is required.'); return; }

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
        await createGrammarRule({ id: form.id.trim(), ...payload });
        setRules((prev) => [
          ...prev,
          {
            id: form.id.trim(),
            category: payload.category,
            usage: payload.usage,
            forms: { general_formula: payload.forms.general_formula },
          },
        ]);
        toast('Grammar rule created.');
      }
      setShowForm(false);
      setEditRule(null);
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

          <div className="grammar-form__grid">
            {/* Row 1: ID (create) + Category, or just Category (edit) */}
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
