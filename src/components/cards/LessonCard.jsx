function LessonCard({ lesson }) {
  const { image, title, description, level } = lesson;

  return (
    <article
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0',
      }}
    >
      <img
        src={image}
        alt={title}
        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ padding: '20px' }}>
        <span
          style={{
            display: 'inline-block',
            marginBottom: '12px',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            background: '#dbeafe',
            color: '#1d4ed8',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {level}
        </span>
        <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{description}</p>
      </div>
    </article>
  );
}

export default LessonCard;