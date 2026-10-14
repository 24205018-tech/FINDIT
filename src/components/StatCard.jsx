import Icon from './Icons.jsx';

/**
 * StatCard — dashboard metric tile with icon, animated value,
 * delta chip and accent colour.
 */
export default function StatCard({
  icon,
  label,
  value,
  delta,
  deltaLabel = 'vs last month',
  positive = true,
  color,
  countUp,
  index = 0
}) {
  return (
    <div className="stat-card" style={{ '--stat-color': color || 'var(--primary)' }}>
      <span className="stat-card__icon">
        <Icon name={icon} size={20} />
      </span>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">
          {countUp === false ? value : countUp ?? value}
        </p>
        {delta && (
          <p className={`stat-card__delta ${positive ? 'is-up' : 'is-down'}`}>
            {positive ? '▲' : '▼'} {delta} <span>{deltaLabel}</span>
          </p>
        )}
      </div>
      {index !== undefined && index > 0 && <span className="stat-card__sparkline" aria-hidden="true" />}
    </div>
  );
}
