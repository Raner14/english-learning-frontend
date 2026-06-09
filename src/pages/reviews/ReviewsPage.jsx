import { useState, useEffect } from 'react';
import { getMyReviews } from '../../services/teacherService';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './ReviewsPage.css';

function StarRating({ rating, max = 5 }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rating ? 'review-star review-star--filled' : 'review-star'}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

function ReviewsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyReviews()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'teacher') return <PlaceholderView title="My Reviews" />;
  if (loading) return <PageLoader text="Loading reviews..." />;

  const avgRating = data?.avgRating ?? 0;
  const reviews = data?.reviews ?? [];

  return (
    <div className="reviews-page">
      <h1 className="reviews-page__title">My Reviews</h1>

      {error && <p className="reviews-page__error">{error}</p>}

      <div className="reviews-page__summary">
        <span className="reviews-page__avg-number">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
        <div className="reviews-page__avg-detail">
          <StarRating rating={Math.round(avgRating)} />
          <span className="reviews-page__review-count">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {reviews.length === 0 && !error ? (
        <div className="reviews-page__empty">
          <p className="reviews-page__empty-text">No reviews yet.</p>
          <p className="reviews-page__empty-hint">
            Students can leave a review after working with you.
          </p>
        </div>
      ) : (
        <div className="reviews-page__list">
          {reviews.map((review, i) => (
            <div key={review.studentId ?? i} className="review-card">
              <div className="review-card__header">
                <StarRating rating={review.rating} />
                <span className="review-card__score">{review.rating} / 5</span>
              </div>
              {review.feedback && (
                <p className="review-card__feedback">"{review.feedback}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;
