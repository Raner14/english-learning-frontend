import { useNavigate } from 'react-router-dom';
import './TeacherCard.css';

function StarRating({ rank }) {
  return (
    <span className="teacher-card__stars" aria-label={`Rating: ${rank} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rank ? 'star star--filled' : 'star'}>&#9733;</span>
      ))}
    </span>
  );
}

function TeacherCard({ teacher, requestStatus = 'idle', onRequest }) {
  const navigate = useNavigate();
  const {
    teacherId,
    firstName,
    lastName,
    rank,
    pricePerWeek,
    specialties = [],
    teachingLevels = [],
    feedbackFrequency,
    available,
    bio,
  } = teacher;

  const buttonLabel = {
    idle: 'Request Teacher',
    loading: 'Requesting...',
    success: '✓ Requested',
    exists: 'Already Requested',
    error: 'Try Again',
  }[requestStatus] ?? 'Request Teacher';

  const isButtonDisabled = requestStatus === 'loading' || requestStatus === 'success' || requestStatus === 'exists';

  return (
    <article className="teacher-card">
      <div className="teacher-card__header">
        <div>
          <h3 className="teacher-card__name">{firstName} {lastName}</h3>
          <StarRating rank={rank} />
        </div>
        <span className={`teacher-card__availability${available ? '' : ' teacher-card__availability--unavailable'}`}>
          {available ? '● Available' : '● Unavailable'}
        </span>
      </div>

      {bio && <p className="teacher-card__bio">{bio}</p>}

      <div className="teacher-card__tags-row">
        {specialties.map((s) => (
          <span key={s} className="teacher-card__tag teacher-card__tag--specialty">{s}</span>
        ))}
      </div>

      <div className="teacher-card__tags-row">
        {teachingLevels.map((lvl) => (
          <span key={lvl} className="teacher-card__tag teacher-card__tag--level">{lvl}</span>
        ))}
      </div>

      <div className="teacher-card__meta">
        <span className="teacher-card__meta-item">
          <strong>${pricePerWeek}</strong> / week
        </span>
        <span className="teacher-card__meta-item teacher-card__meta-item--muted">
          {feedbackFrequency} feedback
        </span>
      </div>

      <div className="teacher-card__actions">
        <button
          type="button"
          className="teacher-card__btn teacher-card__btn--secondary"
          onClick={() => navigate(`/teachers/${teacherId}`)}
        >
          View Profile
        </button>
        <button
          type="button"
          className={`teacher-card__btn teacher-card__btn--primary${isButtonDisabled ? ' teacher-card__btn--disabled' : ''}`}
          disabled={isButtonDisabled}
          onClick={() => onRequest && onRequest(teacherId)}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}

export default TeacherCard;
