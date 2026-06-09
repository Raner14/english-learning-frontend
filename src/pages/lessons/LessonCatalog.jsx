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

  const visibleLessons =
    activeTab === 'All' ? lessons : lessons.filter((l) => l.level === activeTab);

  if (loading) return <PageLoader text="Loading lessons..." />;

  return (
    <div className="lessons-page">
      <h1 className="lessons-page__title">Lesson Catalog</h1>

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
        <p className="lessons-page__empty">No lessons available for this level.</p>
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
