import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLessonCatalog } from '../../services/lessonService';
import LessonCard from '../../components/cards/LessonCard';
import PageLoader from '../../components/common/PageLoader';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function LessonCatalog() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLessonCatalog()
      .then(setLessons)
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Failed to load lessons.');
      })
      .finally(() => setLoading(false));
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const levelFiltered =
    activeTab === 'All' ? lessons : lessons.filter((l) => l.level === activeTab);
  const visibleLessons = q
    ? levelFiltered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.scene || '').toLowerCase().includes(q) ||
          (l.grammarRuleName || '').toLowerCase().includes(q)
      )
    : levelFiltered;

  if (loading) return <PageLoader text="Loading lessons..." />;

  const isFiltered = q || activeTab !== 'All';

  return (
    <div className="lessons-page">
      <h1 className="lessons-page__title">Lesson Catalog</h1>

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
