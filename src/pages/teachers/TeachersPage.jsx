import { useState, useEffect } from 'react';
import { getAllTeachers } from '../../services/teacherService';
import { requestTeacher } from '../../services/relationsService';
import TeacherCard from '../../components/cards/TeacherCard';
import PageLoader from '../../components/common/PageLoader';
import './TeachersPage.css';

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  // Per-teacher request button state: { [teacherId]: 'idle'|'loading'|'success'|'exists'|'error' }
  const [requestStatus, setRequestStatus] = useState({});

  useEffect(() => {
    getAllTeachers()
      .then(setTeachers)
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load teachers.');
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleTeachers = teachers
    .filter((t) => !availableOnly || t.available)
    .filter((t) => maxPrice === '' || t.pricePerWeek <= Number(maxPrice));

  async function handleRequest(teacherId) {
    setRequestStatus((prev) => ({ ...prev, [teacherId]: 'loading' }));
    try {
      await requestTeacher(teacherId);
      setRequestStatus((prev) => ({ ...prev, [teacherId]: 'success' }));
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      const next = code === 'RELATION_ALREADY_EXISTS' ? 'exists' : 'error';
      setRequestStatus((prev) => ({ ...prev, [teacherId]: next }));
    }
  }

  function handleClearFilters() {
    setAvailableOnly(false);
    setMaxPrice('');
  }

  const filtersActive = availableOnly || maxPrice !== '';

  if (loading) return <PageLoader text="Loading teachers..." />;

  return (
    <div className="teachers-page">
      <h1 className="teachers-page__title">Find a Teacher</h1>

      <div className="teachers-page__filters">
        <label className="teachers-filter__toggle">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Available only
        </label>

        <div className="teachers-filter__price">
          <label htmlFor="maxPrice" className="teachers-filter__label">
            Max price
          </label>
          <div className="teachers-filter__price-input-wrap">
            <span className="teachers-filter__currency">$</span>
            <input
              id="maxPrice"
              type="number"
              min="0"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="teachers-filter__input"
            />
            <span className="teachers-filter__unit">/ week</span>
          </div>
        </div>

        {filtersActive && (
          <button type="button" className="teachers-filter__clear" onClick={handleClearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="teachers-page__error">{error}</p>}

      <p className="teachers-page__count">
        {visibleTeachers.length === 1
          ? '1 teacher found'
          : `${visibleTeachers.length} teachers found`}
      </p>

      {visibleTeachers.length === 0 && !error ? (
        <p className="teachers-page__empty">
          No teachers match your filters. Try adjusting the criteria.
        </p>
      ) : (
        <div className="teachers-page__grid">
          {visibleTeachers.map((teacher) => (
            <TeacherCard
              key={teacher.teacherId}
              teacher={teacher}
              requestStatus={requestStatus[teacher.teacherId] ?? 'idle'}
              onRequest={handleRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TeachersPage;
