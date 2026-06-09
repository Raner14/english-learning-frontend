import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLesson,
  getLessonVocab,
  createLessonVocabItem,
  updateLessonVocabItem,
  deleteLessonVocabItem,
} from '../../services/lessonService';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './LessonVocabPage.css';

const BLANK_FORM = {
  word: '',
  translation: '',
  definition: '',
  example: '',
  completeSentence: '',
};

function itemToForm(item) {
  return {
    word: item.word || '',
    translation: item.translation || '',
    definition: item.definition || '',
    example: item.example || '',
    completeSentence: item.completeSentence || '',
  };
}

function LessonVocabPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    Promise.all([
      getLesson(lessonId),
      getLessonVocab(lessonId),
    ])
      .then(([lessonData, vocabData]) => {
        setLesson(lessonData);
        setItems(vocabData || []);
      })
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load lesson vocabulary.'))
      .finally(() => setLoading(false));
  }, [lessonId, user?.role]);

  if (user?.role !== 'admin') return <PlaceholderView title="Lesson Vocabulary" />;
  if (loading) return <PageLoader text="Loading vocabulary…" />;

  function handleAddClick() {
    setEditItem(null);
    setForm(BLANK_FORM);
    setFormError('');
    setShowForm(true);
  }

  function handleEditClick(item) {
    setEditItem(item);
    setForm(itemToForm(item));
    setFormError('');
    setConfirmId(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditItem(null);
    setFormError('');
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.word.trim()) { setFormError('Word is required.'); return; }
    if (!form.translation.trim()) { setFormError('Translation is required.'); return; }
    if (!form.definition.trim()) { setFormError('Definition is required.'); return; }
    if (!form.example.trim()) { setFormError('Example is required.'); return; }
    if (!form.completeSentence.trim()) { setFormError('Complete sentence is required.'); return; }

    setFormSaving(true);
    setFormError('');
    const payload = {
      word: form.word.trim(),
      translation: form.translation.trim(),
      definition: form.definition.trim(),
      example: form.example.trim(),
      completeSentence: form.completeSentence.trim(),
    };

    try {
      if (editItem) {
        await updateLessonVocabItem(lessonId, editItem.vocabularyId, payload);
        setItems((prev) =>
          prev.map((it) =>
            it.vocabularyId === editItem.vocabularyId ? { ...it, ...payload } : it
          )
        );
      } else {
        const result = await createLessonVocabItem(lessonId, payload);
        setItems((prev) => [...prev, { vocabularyId: result.vocabularyId, ...payload }]);
      }
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      setFormError(err?.response?.data?.error?.message || 'Failed to save vocabulary item.');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(vocabId) {
    setDeletingId(vocabId);
    setConfirmId(null);
    try {
      await deleteLessonVocabItem(lessonId, vocabId);
      setItems((prev) => prev.filter((it) => it.vocabularyId !== vocabId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete vocabulary item.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="lesson-vocab-page">
      <button type="button" className="lesson-vocab-page__back" onClick={() => navigate('/lessons')}>
        ← Back to Lessons
      </button>

      <div className="lesson-vocab-page__header">
        <div>
          <h1 className="lesson-vocab-page__title">Vocabulary</h1>
          {lesson && (
            <p className="lesson-vocab-page__subtitle">{lesson.title}</p>
          )}
        </div>
        {!showForm && (
          <button type="button" className="lesson-vocab-page__add-btn" onClick={handleAddClick}>
            + Add Word
          </button>
        )}
      </div>

      {error && <p className="lesson-vocab-page__error">{error}</p>}

      {/* Create / Edit form panel */}
      {showForm && (
        <form className="vocab-form" onSubmit={handleFormSubmit} noValidate>
          <h2 className="vocab-form__title">{editItem ? `Edit: ${editItem.word}` : 'New Vocabulary Item'}</h2>

          <div className="vocab-form__grid">
            <div className="vocab-form__field vocab-form__field--half">
              <label className="vocab-form__label">Word *</label>
              <input
                name="word"
                className="vocab-form__input"
                placeholder="e.g. negotiate"
                value={form.word}
                onChange={handleFormChange}
              />
            </div>

            <div className="vocab-form__field vocab-form__field--half">
              <label className="vocab-form__label">Translation *</label>
              <input
                name="translation"
                className="vocab-form__input"
                placeholder="e.g. לנהל משא ומתן"
                value={form.translation}
                onChange={handleFormChange}
              />
            </div>

            <div className="vocab-form__field vocab-form__field--full">
              <label className="vocab-form__label">Definition *</label>
              <textarea
                name="definition"
                className="vocab-form__textarea"
                rows={2}
                placeholder="Brief definition of the word…"
                value={form.definition}
                onChange={handleFormChange}
              />
            </div>

            <div className="vocab-form__field vocab-form__field--full">
              <label className="vocab-form__label">Example sentence *</label>
              <textarea
                name="example"
                className="vocab-form__textarea"
                rows={2}
                placeholder="e.g. We negotiated a deal with the supplier."
                value={form.example}
                onChange={handleFormChange}
              />
            </div>

            <div className="vocab-form__field vocab-form__field--full">
              <label className="vocab-form__label">Complete sentence *</label>
              <textarea
                name="completeSentence"
                className="vocab-form__textarea"
                rows={2}
                placeholder="A complete sentence using the word in context…"
                value={form.completeSentence}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {formError && <p className="vocab-form__error">{formError}</p>}

          <div className="vocab-form__actions">
            <button type="submit" className="vocab-form__submit-btn" disabled={formSaving}>
              {formSaving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Word'}
            </button>
            <button
              type="button"
              className="vocab-form__cancel-btn"
              onClick={handleCancel}
              disabled={formSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Vocabulary table */}
      {items.length === 0 && !showForm ? (
        <p className="lesson-vocab-page__empty">No vocabulary items yet. Add the first word above.</p>
      ) : (
        <div className="vocab-table-wrap">
          <table className="vocab-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Translation</th>
                <th>Definition</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.vocabularyId}
                  className={deletingId === item.vocabularyId ? 'vocab-table__row--deleting' : ''}
                >
                  <td className="vocab-table__word">{item.word}</td>
                  <td className="vocab-table__translation">{item.translation}</td>
                  <td className="vocab-table__definition">{item.definition}</td>
                  <td className="vocab-table__actions">
                    {confirmId === item.vocabularyId ? (
                      <span className="vocab-table__btn-group">
                        <button
                          type="button"
                          className="vocab-table__btn vocab-table__btn--confirm"
                          onClick={() => handleDelete(item.vocabularyId)}
                          disabled={deletingId === item.vocabularyId}
                        >
                          {deletingId === item.vocabularyId ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="vocab-table__btn vocab-table__btn--cancel"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="vocab-table__btn-group">
                        <button
                          type="button"
                          className="vocab-table__btn vocab-table__btn--edit"
                          onClick={() => handleEditClick(item)}
                          disabled={!!deletingId}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="vocab-table__btn vocab-table__btn--delete"
                          onClick={() => setConfirmId(item.vocabularyId)}
                          disabled={!!deletingId}
                        >
                          Delete
                        </button>
                      </span>
                    )}
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

export default LessonVocabPage;
