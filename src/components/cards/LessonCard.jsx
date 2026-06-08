import './LessonCard.css';

function LessonCard({ lesson }) {
  const { image, title, description, level } = lesson;

  return (
    <article className="lesson-card">
      <img src={image} alt={title} className="lesson-card__image" />
      <div className="lesson-card__body">
        <span className="lesson-card__badge">
          {level}
        </span>
        <h3 className="lesson-card__title">{title}</h3>
        <p className="lesson-card__description">{description}</p>
      </div>
    </article>
  );
}

export default LessonCard;