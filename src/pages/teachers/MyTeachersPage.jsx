import { useState, useEffect } from 'react';
import { getMyTeachers, removeRelation } from '../../services/relationsService';
import { getTeacher } from '../../services/teacherService';
import TeacherCard from '../../components/cards/TeacherCard';
import PageLoader from '../../components/common/PageLoader';
import './MyTeachersPage.css';

function MyTeachersPage() {
  // Each entry is { ...teacherProfile, relationId }
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Per-teacher remove state: { [teacherId]: 'idle'|'loading'|'error' }
  const [removeStatus, setRemoveStatus] = useState({});

  useEffect(() => {
    getMyTeachers()
      .then((relations) => {
        if (!relations.length) return [];
        return Promise.all(
          relations.map((r) =>
            getTeacher(r.teacherId).then((profile) => ({ ...profile, relationId: r.relationId }))
          )
        );
      })
      .then(setTeachers)
      .catch((err) =>
        setError(err?.response?.data?.error?.message || 'Failed to load your teachers.')
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(teacherId) {
    const teacher = teachers.find((t) => t.teacherId === teacherId);
    if (!teacher?.relationId) return;
    setRemoveStatus((prev) => ({ ...prev, [teacherId]: 'loading' }));
    try {
      await removeRelation(teacher.relationId);
      setTeachers((prev) => prev.filter((t) => t.teacherId !== teacherId));
    } catch {
      setRemoveStatus((prev) => ({ ...prev, [teacherId]: 'error' }));
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? teachers.filter(
        (t) =>
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
          (t.specialties || []).some((s) => s.toLowerCase().includes(q))
      )
    : teachers;

  if (loading) return <PageLoader text="Loading your teachers…" />;

  const countLabel =
    teachers.length === 1
      ? '1 teacher assigned to you.'
      : `${teachers.length} teachers assigned to you.`;

  return (
    <div className="my-teachers-page">
      <h1 className="my-teachers-page__title">My Teachers</h1>

      {!error && (
        <p className="my-teachers-page__subtitle">{countLabel}</p>
      )}

      {error && <p className="my-teachers-page__error">{error}</p>}

      {!error && teachers.length > 0 && (
        <input
          type="search"
          className="my-teachers-page__search"
          placeholder="Search by name or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {!error && filtered.length === 0 && (
        <p className="my-teachers-page__empty">
          {teachers.length === 0
            ? "You don't have any teachers yet. Visit Match Teacher to get paired with one."
            : 'No teachers match your search.'}
        </p>
      )}

      {!error && filtered.length > 0 && (
        <div className="my-teachers-page__grid">
          {filtered.map((teacher) => (
            <TeacherCard
              key={teacher.teacherId}
              teacher={teacher}
              onRemove={handleRemove}
              removeStatus={removeStatus[teacher.teacherId] ?? 'idle'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTeachersPage;
