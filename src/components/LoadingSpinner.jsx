/** Inline spinner used while mock data "loads" */
export default function LoadingSpinner({ label = 'Loading…', size = 'md', className = '' }) {
  return (
    <div className={`spinner-wrap spinner-wrap--${size} ${className}`.trim()} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label && <span className="spinner-wrap__label">{label}</span>}
    </div>
  );
}

/** Skeleton placeholders that look like real cards while loading */
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card skeleton-card" key={i} aria-hidden="true">
          <div className="skeleton skeleton--thumb" />
          <div className="card__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}
