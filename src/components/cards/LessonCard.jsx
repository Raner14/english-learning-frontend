import './LessonCard.css';

function LessonCard({ lesson, onStart }) {
  const {
    lessonId,
    title,
    scene,
    level,
    grammarRuleName,
    vocabularyCount,
    isLocked,
    lockReason,
    isCompleted,
  } = lesson;

  const levelClass = `lesson-card__level--${level.toLowerCase()}`;

  function handleStart() {
    if (!isLocked && onStart) {
      onStart(lessonId);
    }
  }

  return (
    <article className={`lesson-card${isLocked ? ' lesson-card--locked' : ''}`}>
      <div className="lesson-card__header">
        <span className={`lesson-card__level ${levelClass}`}>{level}</span>
        {isCompleted && <span className="lesson-card__completed-badge">&#10003; Done</span>}
        {isLocked && <span className="lesson-card__lock-icon" title={lockReason || 'Locked'}>&#128274;</span>}
      </div>

      <h3 className="lesson-card__title">{title}</h3>
      <p className="lesson-card__scene">{scene}</p>

      <div className="lesson-card__meta">
        <span className="lesson-card__meta-item">
          <span className="lesson-card__meta-label">Grammar</span>
          {grammarRuleName}
        </span>
        <span className="lesson-card__meta-item">
          <span className="lesson-card__meta-label">Vocab</span>
          {vocabularyCount} words
        </span>
      </div>

      <button
        type="button"
        className={`lesson-card__button${isLocked ? ' lesson-card__button--locked' : ''}`}
        disabled={isLocked}
        onClick={handleStart}
      >
        {isLocked ? 'Locked' : isCompleted ? 'Restart' : 'Start Lesson'}
      </button>
    </article>
  );
}

export default LessonCard;
