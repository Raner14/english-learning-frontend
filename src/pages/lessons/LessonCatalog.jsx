import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLessonCatalog } from '../../services/lessonService';
import { getProgressStats } from '../../services/progressService';
import LessonCard from '../../components/cards/LessonCard';
import PageLoader from '../../components/common/PageLoader';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function LessonCatalog() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('Beginner');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null = not yet assessed; non-null = level is set; undefined = still loading / couldn't fetch
  const [currentLevel, setCurrentLevel] = useState(undefined);

  useEffect(() => {
    Promise.all([
      getLessonCatalog(),
      getProgressStats().catch(() => null),
    ]).then(([lessonList, stats]) => {
      setLessons(lessonList);
      setCurrentLevel(stats != null ? stats.currentLevel : undefined);
    }).catch((err) => {
      setError(err?.response?.data?.error?.message || 'Failed to load lessons.');
    }).finally(() => setLoading(false));
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const levelFiltered = lessons.filter((l) => l.level === activeTab);
  const filteredLessons = q
    ? levelFiltered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.scene || '').toLowerCase().includes(q) ||
          (l.grammarRuleName || '').toLowerCase().includes(q)
      )
    : levelFiltered;

  const LEVEL_ORDER = { Beginner: 1, Intermediate: 2, Advanced: 3 };

  // currentLevel === undefined  → stats failed to load, leave lessons unlocked
  // currentLevel === null       → no assessment done yet, all lessons locked
  // currentLevel === string     → lessons at student's level or below are unlocked
  const visibleLessons = filteredLessons.map((lesson) => {
    if (currentLevel === undefined) return lesson;
    const studentRank = currentLevel ? (LEVEL_ORDER[currentLevel] ?? 0) : 0;
    const lessonRank = LEVEL_ORDER[lesson.level] ?? 99;
    const locked = currentLevel === null || lessonRank > studentRank;
    if (!locked) return lesson;
    return {
      ...lesson,
      isLocked: true,
      lockReason:
        currentLevel === null
          ? 'Complete the AI assessment to unlock lessons.'
          : `This lesson requires ${lesson.level} level or above.`,
    };
  });

  if (loading) return <PageLoader text="Loading lessons..." />;

  const isFiltered = !!q;

  return (
    <div className="lessons-page">
      <h1 className="lessons-page__title">Lesson Catalog</h1>

      {currentLevel === null && (
        <div className="lessons-page__assessment-banner">
          <span className="lessons-page__assessment-icon">📊</span>
          <p className="lessons-page__assessment-text">
            We haven't determined your current English level yet.{' '}
            <Link to="/assessment" className="lessons-page__assessment-link">
              Click here
            </Link>{' '}
            to take an AI assessment and set your level.
          </p>
        </div>
      )}

      <div className="lessons-page__search-bar">
        <input
          type="search"
          className="lessons-page__search-input"
          placeholder="Search by title, scene or grammar rule…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isFiltered && (
          <span className="lessons-page__search-count">
            {visibleLessons.length} of {lessons.length}
          </span>
        )}
      </div>

      <div className="lessons-page__tabs" role="tablist" aria-label="Filter by level">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="tab"
            aria-selected={activeTab === level}
            className={`lessons-page__tab${activeTab === level ? ' lessons-page__tab--active' : ''}`}
            onClick={() => setActiveTab(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {error && <p className="lessons-page__error">{error}</p>}

      {visibleLessons.length === 0 && !error && (
        <p className="lessons-page__empty">
          {isFiltered
            ? 'No lessons match your search.'
            : 'No lessons available for this level.'}
        </p>
      )}

      <div className="lessons-page__grid">
        {visibleLessons.map((lesson) => (
          <LessonCard
            key={lesson.lessonId}
            lesson={lesson}
            onStart={(id) => navigate(`/lessons/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default LessonCatalog;
