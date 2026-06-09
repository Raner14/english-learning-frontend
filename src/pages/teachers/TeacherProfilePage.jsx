import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeacher } from '../../services/teacherService';
import { requestTeacher } from '../../services/relationsService';
import PageLoader from '../../components/common/PageLoader';
import './TeacherProfilePage.css';

function StarRating({ rank }) {
  return (
    <span className="profile-stars" aria-label={`Rating: ${rank} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rank ? 'profile-star profile-star--filled' : 'profile-star'}>
          &#9733;
        </span>
      ))}
      <span className="profile-stars__label">{rank} / 5</span>
    </span>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div className="profile-info__row">
      <span className="profile-info__label">{label}</span>
      <span className="profile-info__value">{value}</span>
    </div>
  );
}

function TeacherProfilePage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle');

  useEffect(() => {
    getTeacher(teacherId)
      .then(setTeacher)
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Teacher not found.');
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  async function handleRequest() {
    setRequestStatus('loading');
    try {
      await requestTeacher(teacher.teacherId);
      setRequestStatus('success');
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      setRequestStatus(code === 'RELATION_ALREADY_EXISTS' ? 'exists' : 'error');
    }
  }

  if (loading) return <PageLoader text="Loading profile..." />;

  if (error) {
    return (
      <div className="teacher-profile">
        <button type="button" className="teacher-profile__back" onClick={() => navigate('/teachers')}>
          ← Back to Teachers
        </button>
        <p className="teacher-profile__error">{error}</p>
      </div>
    );
  }

  const {
    firstName, lastName, rank, pricePerWeek, specialties = [],
    teachingLevels = [], feedbackFrequency, available, bio,
    experience, availability, onlineOnly,
  } = teacher;

  const requestLabel = {
    idle: 'Request Teacher',
    loading: 'Requesting...',
    success: '✓ Requested',
    exists: 'Already Requested',
    error: 'Try Again',
  }[requestStatus];

  const isDisabled = requestStatus === 'loading' || requestStatus === 'success' || requestStatus === 'exists';

  return (
    <div className="teacher-profile">
      <button type="button" className="teacher-profile__back" onClick={() => navigate('/teachers')}>
        ← Back to Teachers
      </button>

      <div className="teacher-profile__header">
        <div className="teacher-profile__title-row">
          <h1 className="teacher-profile__name">{firstName} {lastName}</h1>
          <span className={`teacher-profile__availability${available ? '' : ' teacher-profile__availability--unavailable'}`}>
            {available ? '● Available' : '● Unavailable'}
          </span>
        </div>
        <StarRating rank={rank} />
      </div>

      {bio && (
        <section className="teacher-profile__section">
          <p className="teacher-profile__bio">{bio}</p>
        </section>
      )}

      <section className="teacher-profile__section">
        <h2 className="teacher-profile__section-title">Details</h2>
        <div className="profile-info">
          <InfoRow label="Price" value={`$${pricePerWeek} / week`} />
          <InfoRow label="Feedback" value={feedbackFrequency ? `${feedbackFrequency.charAt(0).toUpperCase() + feedbackFrequency.slice(1)} feedback` : null} />
          <InfoRow label="Availability" value={availability ? availability.charAt(0).toUpperCase() + availability.slice(1) : null} />
          <InfoRow label="Format" value={onlineOnly ? 'Online only' : 'Online & in-person'} />
          <InfoRow label="Experience" value={experience} />
        </div>
      </section>

      {specialties.length > 0 && (
        <section className="teacher-profile__section">
          <h2 className="teacher-profile__section-title">Specialties</h2>
          <div className="teacher-profile__tags">
            {specialties.map((s) => (
              <span key={s} className="teacher-profile__tag teacher-profile__tag--specialty">{s}</span>
            ))}
          </div>
        </section>
      )}

      {teachingLevels.length > 0 && (
        <section className="teacher-profile__section">
          <h2 className="teacher-profile__section-title">Teaching Levels</h2>
          <div className="teacher-profile__tags">
            {teachingLevels.map((lvl) => (
              <span key={lvl} className="teacher-profile__tag teacher-profile__tag--level">{lvl}</span>
            ))}
          </div>
        </section>
      )}

      <div className="teacher-profile__cta">
        <button
          type="button"
          className={`teacher-profile__request-btn${isDisabled ? ' teacher-profile__request-btn--done' : ''}`}
          disabled={isDisabled}
          onClick={handleRequest}
        >
          {requestLabel}
        </button>
      </div>
    </div>
  );
}

export default TeacherProfilePage;
