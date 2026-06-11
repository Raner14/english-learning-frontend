import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyTeachers, reviewTeacher } from '../../services/relationsService';
import PlaceholderView from '../../components/common/PlaceholderView';
import PageLoader from '../../components/common/PageLoader';
import './ReviewTeacherPage.css';

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-input" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-input__star ${star <= (hovered || value) ? 'star-input__star--active' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewTeacherPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMyTeachers()
      .then(setTeachers)
      .catch((err) => setLoadError(err?.response?.data?.error?.message || 'Failed to load teachers.'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'student') {
    return <PlaceholderView title="Review Teacher" />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await reviewTeacher(selectedTeacher.relationId, rating, feedback.trim());
      setSuccess(true);
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    setSelectedTeacher(null);
    setRating(0);
    setFeedback('');
    setSubmitError('');
  }

  if (success) {
    return (
      <div className="review-teacher-page">
        <div className="review-teacher__success">
          <p className="review-teacher__success-icon">✓</p>
          <h2 className="review-teacher__success-title">Review submitted!</h2>
          <p className="review-teacher__success-sub">Thank you for your feedback.</p>
          <button type="button" className="review-teacher__btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Step 2: review form for the selected teacher
  if (selectedTeacher) {
    return (
      <div className="review-teacher-page">
        <button type="button" className="review-teacher__back" onClick={handleBack}>
          ← Back to teachers
        </button>
        <h1 className="review-teacher-page__title">
          Review {selectedTeacher.firstName} {selectedTeacher.lastName}
        </h1>
        <p className="review-teacher-page__subtitle">
          Share your experience to help the community and improve the platform.
        </p>
        <form className="review-teacher__form" onSubmit={handleSubmit} noValidate>
          <div className="review-teacher__field">
            <label className="review-teacher__label">Rating</label>
            <StarInput value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="review-teacher__rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>
          <div className="review-teacher__field">
            <label htmlFor="feedback" className="review-teacher__label">
              Feedback <span className="review-teacher__optional">(optional)</span>
            </label>
            <textarea
              id="feedback"
              className="review-teacher__textarea"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like? What could be improved?"
              maxLength={500}
            />
            <p className="review-teacher__char-count">{feedback.length}/500</p>
          </div>
          {submitError && <p className="review-teacher__error">{submitError}</p>}
          <div className="review-teacher__actions">
            <button
              type="submit"
              className="review-teacher__btn"
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button
              type="button"
              className="review-teacher__btn review-teacher__btn--ghost"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 1: teacher list with search
  const q = search.trim().toLowerCase();
  const filtered = q
    ? teachers.filter((t) => `${t.firstName} ${t.lastName}`.toLowerCase().includes(q))
    : teachers;

  return (
    <div className="review-teacher-page">
      <h1 className="review-teacher-page__title">Review Your Teacher</h1>
      <p className="review-teacher-page__subtitle">
        Select a teacher to leave a rating and feedback for.
      </p>

      {loading && <PageLoader text="Loading your teachers…" />}
      {!loading && loadError && <p className="review-teacher__error">{loadError}</p>}

      {!loading && !loadError && (
        <>
          <input
            type="search"
            className="review-teacher__search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length === 0 ? (
            <p className="review-teacher__empty">
              {teachers.length === 0
                ? 'You have no active teachers to review.'
                : 'No teachers match your search.'}
            </p>
          ) : (
            <ul className="review-teacher__teacher-list">
              {filtered.map((teacher) => (
                <li key={teacher.relationId}>
                  <button
                    type="button"
                    className="review-teacher__teacher-card"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <div className="review-teacher__teacher-info">
                      <span className="review-teacher__teacher-name">
                        {teacher.firstName} {teacher.lastName}
                      </span>
                      <span className="review-teacher__teacher-stars">
                        {'★'.repeat(teacher.rank ?? 0)}{'☆'.repeat(5 - (teacher.rank ?? 0))}
                      </span>
                    </div>
                    <span className="review-teacher__teacher-cta">Write review →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewTeacherPage;
