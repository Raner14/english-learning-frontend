import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reviewTeacher } from '../../services/relationsService';
import PlaceholderView from '../../components/common/PlaceholderView';
import './ReviewTeacherPage.css';

// Star rating input
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

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Student-only
  if (user?.role !== 'student') {
    return <PlaceholderView title="Review Teacher" />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await reviewTeacher(rating, feedback.trim());
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="review-teacher-page">
        <div className="review-teacher__success">
          <p className="review-teacher__success-icon">✓</p>
          <h2 className="review-teacher__success-title">Review submitted!</h2>
          <p className="review-teacher__success-sub">Thank you for your feedback.</p>
          <button
            type="button"
            className="review-teacher__btn"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-teacher-page">
      <h1 className="review-teacher-page__title">Review Your Teacher</h1>
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

        {error && <p className="review-teacher__error">{error}</p>}

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

export default ReviewTeacherPage;
