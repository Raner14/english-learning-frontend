import './StatCard.css';

// Reusable card for displaying a single statistic (title + big number + optional subtitle).
// Used on all three dashboard types (student, teacher, admin).
function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">{value ?? '—'}</p>
      {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
    </div>
  );
}

export default StatCard;
