import { useState, useEffect } from 'react';
import { getAllTeachers } from '../../services/teacherService';
import { requestTeacher, removeRelation, getMyRelations } from '../../services/relationsService';
import TeacherCard from '../../components/cards/TeacherCard';
import PageLoader from '../../components/common/PageLoader';
import './TeachersPage.css';

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [nameQuery, setNameQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  // Per-teacher request button state: { [teacherId]: 'idle'|'loading'|'success'|'exists'|'error' }
  const [requestStatus, setRequestStatus] = useState({});
  // Maps teacherId → relationId for active connections (used by handleRemove)
  const [relationIdByTeacherId, setRelationIdByTeacherId] = useState({});
  // Per-teacher remove button state: { [teacherId]: 'idle'|'loading'|'error' }
  const [removeStatus, setRemoveStatus] = useState({});

  useEffect(() => {
    Promise.all([getAllTeachers(), getMyRelations()])
      .then(([teacherList, myRelations]) => {
        setTeachers(teacherList);
        const statusMap = {};
        const relIdMap = {};
        myRelations.forEach((r) => {
          if (r.status === 'active') {
            statusMap[r.teacherId] = 'exists';
            relIdMap[r.teacherId] = r.relationId;
          } else {
            statusMap[r.teacherId] = 'success';
          }
        });
        setRequestStatus(statusMap);
        setRelationIdByTeacherId(relIdMap);
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load teachers.');
      })
      .finally(() => setLoading(false));
  }, []);

  const nq = nameQuery.trim().toLowerCase();
  const visibleTeachers = teachers
    .filter((t) => !nq || (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(nq) ||
      (t.specialties || []).some((s) => s.toLowerCase().includes(nq)) ||
      (t.bio || '').toLowerCase().includes(nq)
    ))
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

  async function handleRemove(teacherId) {
    const relationId = relationIdByTeacherId[teacherId];
    if (!relationId) return;
    setRemoveStatus((prev) => ({ ...prev, [teacherId]: 'loading' }));
    try {
      await removeRelation(relationId);
      setRequestStatus((prev) => ({ ...prev, [teacherId]: 'idle' }));
      setRelationIdByTeacherId((prev) => {
        const next = { ...prev };
        delete next[teacherId];
        return next;
      });
      setRemoveStatus((prev) => ({ ...prev, [teacherId]: 'idle' }));
    } catch {
      setRemoveStatus((prev) => ({ ...prev, [teacherId]: 'error' }));
    }
  }

  function handleClearFilters() {
    setNameQuery('');
    setAvailableOnly(false);
    setMaxPrice('');
  }

  const filtersActive = nq || availableOnly || maxPrice !== '';

  if (loading) return <PageLoader text="Loading teachers..." />;

  return (
    <div className="teachers-page">
      <h1 className="teachers-page__title">Find a Teacher</h1>

      <div className="teachers-page__filters">
        <input
          type="search"
          className="teachers-filter__search"
          placeholder="Search by name, specialty or bio…"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
        />

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
              onRemove={relationIdByTeacherId[teacher.teacherId] ? handleRemove : undefined}
              removeStatus={removeStatus[teacher.teacherId] ?? 'idle'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TeachersPage;
