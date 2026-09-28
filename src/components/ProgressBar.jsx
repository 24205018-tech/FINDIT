/** Segmented progress bar for match scores & chart bars */
export default function ProgressBar({ value = 0, color, height = 8, showTrack = true, className = '' }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress ${className}`.trim()}>
      {showTrack && <div className="progress__track" style={{ height }} />}
      <div
        className="progress__fill"
        style={{ width: `${v}%`, height, background: color || 'var(--primary)' }}
      />
    </div>
  );
}
