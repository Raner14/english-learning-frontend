import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePreferences } from '../../services/matchingService';
import { requestTeacher, getMyRelations } from '../../services/relationsService';
import Button from '../../components/common/Button';
import './MatchTeacherPage.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const AVAILABILITIES = ['mornings', 'evenings', 'flexible'];
const MAIN_GOALS = [
  { value: 'interview_prep', label: 'Interview Preparation' },
  { value: 'speaking', label: 'Speaking Confidence' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
];

const INITIAL_FORM = {
  budget_max: '',
  onboarding_text: '',
  currentLevel: 'Intermediate',
  availability: 'evenings',
  mainGoal: 'interview_prep',
  onlineOnly: false,
};

function StarRating({ rank }) {
  return (
    <span className="match-stars" aria-label={`Rating: ${rank} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rank ? 'match-star match-star--filled' : 'match-star'}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

function MatchTeacherPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [recommendations, setRecommendations] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Per-recommendation request state: { [teacherId]: 'idle'|'loading'|'success'|'exists'|'error' }
  const [requestStatus, setRequestStatus] = useState({});
  const resultsRef = useRef(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.budget_max || Number(form.budget_max) <= 0) {
      errors.budget_max = 'Enter a budget greater than 0.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    setRecommendations(null);

    try {
      const [results, myRelations] = await Promise.all([
        savePreferences({
          budget_max: Number(form.budget_max),
          learning_goal: form.onboarding_text.trim() || 'general english',
          onboarding_text: form.onboarding_text.trim() || 'general english',
          currentLevel: form.currentLevel,
          availability: form.availability,
          mainGoal: form.mainGoal,
          onlineOnly: form.onlineOnly,
        }),
        getMyRelations(),
      ]);
      setRecommendations((results || []).slice().sort((a, b) => b.rank - a.rank));
      const initial = {};
      myRelations.forEach((r) => {
        initial[r.teacherId] = r.status === 'active' ? 'exists' : 'success';
      });
      setRequestStatus(initial);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message || 'Failed to get recommendations.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequest(teacherId) {
    setRequestStatus((prev) => ({ ...prev, [teacherId]: 'loading' }));
    try {
      await requestTeacher(teacherId);
      setRequestStatus((prev) => ({ ...prev, [teacherId]: 'success' }));
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      setRequestStatus((prev) => ({
        ...prev,
        [teacherId]: code === 'RELATION_ALREADY_EXISTS' ? 'exists' : 'error',
      }));
    }
  }

  return (
    <div className="match-page">
      <h1 className="match-page__title">Match Teacher</h1>
      <p className="match-page__subtitle">
        Tell us your goals and budget — we'll find the best teacher for you.
      </p>

      <form className="match-form" onSubmit={handleSubmit} noValidate>
        <div className="match-form__row">
          <div className="match-form__field">
            <label className="match-form__label" htmlFor="budget_max">
              Max budget
            </label>
            <div className="match-form__price-wrap">
              <span className="match-form__currency">$</span>
              <input
                id="budget_max"
                name="budget_max"
                type="number"
                min="1"
                placeholder="100"
                value={form.budget_max}
                onChange={handleChange}
                className={`match-form__input${formErrors.budget_max ? ' match-form__input--error' : ''}`}
              />
              <span className="match-form__unit">/ week</span>
            </div>
            {formErrors.budget_max && (
              <p className="match-form__error">{formErrors.budget_max}</p>
            )}
          </div>

          <div className="match-form__field">
            <label className="match-form__label" htmlFor="currentLevel">
              Your level
            </label>
            <select
              id="currentLevel"
              name="currentLevel"
              value={form.currentLevel}
              onChange={handleChange}
              className="match-form__select"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="match-form__row">
          <div className="match-form__field">
            <label className="match-form__label" htmlFor="mainGoal">
              Main focus
            </label>
            <select
              id="mainGoal"
              name="mainGoal"
              value={form.mainGoal}
              onChange={handleChange}
              className="match-form__select"
            >
              {MAIN_GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="match-form__field">
            <label className="match-form__label" htmlFor="availability">
              Availability
            </label>
            <select
              id="availability"
              name="availability"
              value={form.availability}
              onChange={handleChange}
              className="match-form__select"
            >
              {AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="match-form__field">
          <label className="match-form__label" htmlFor="onboarding_text">
            Describe the teacher you're looking for <span className="match-form__optional">(optional)</span>
          </label>
          <textarea
            id="onboarding_text"
            name="onboarding_text"
            rows={3}
            placeholder="e.g. I'm looking for a patient teacher who specializes in interview preparation and can help me practice speaking confidently"
            value={form.onboarding_text}
            onChange={handleChange}
            className="match-form__textarea"
          />
        </div>

        <label className="match-form__checkbox">
          <input
            type="checkbox"
            name="onlineOnly"
            checked={form.onlineOnly}
            onChange={handleChange}
          />
          Online lessons only
        </label>

        {submitError && <p className="match-form__submit-error">{submitError}</p>}

        <Button type="submit" isLoading={submitting} disabled={submitting}>
          Find My Teacher
        </Button>
      </form>

      {recommendations !== null && (
        <section className="match-results" ref={resultsRef}>
          <h2 className="match-results__title">
            {recommendations.length > 0
              ? `${recommendations.length} teacher${recommendations.length > 1 ? 's' : ''} match your preferences`
              : 'No teachers match your current preferences'}
          </h2>

          {recommendations.length === 0 && (
            <p className="match-results__empty">
              Try increasing your budget or adjusting your filters.
            </p>
          )}

          <div className="match-results__grid">
            {recommendations.map((rec) => {
              const status = requestStatus[rec.teacherId] ?? 'idle';
              const reqLabel = {
                idle: 'Request Teacher',
                loading: 'Requesting...',
                success: '✓ Requested',
                exists: 'Already Requested',
                error: 'Try Again',
              }[status];
              const isDisabled = status === 'loading' || status === 'success' || status === 'exists';

              return (
                <div key={rec.teacherId} className="match-card">
                  <div className="match-card__header">
                    <span className="match-card__name">{rec.firstName}</span>
                    <StarRating rank={rec.rank} />
                  </div>

                  <div className="match-card__meta">
                    <span className="match-card__price">${rec.pricePerWeek} / week</span>
                  </div>

                  {rec.specialties?.length > 0 && (
                    <div className="match-card__tags">
                      {rec.specialties.map((s) => (
                        <span key={s} className="match-card__tag">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="match-card__actions">
                    <button
                      type="button"
                      className="match-card__btn match-card__btn--secondary"
                      onClick={() => navigate(`/teachers/${rec.teacherId}`)}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className={`match-card__btn match-card__btn--primary${isDisabled ? ' match-card__btn--done' : ''}`}
                      disabled={isDisabled}
                      onClick={() => handleRequest(rec.teacherId)}
                    >
                      {reqLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default MatchTeacherPage;
