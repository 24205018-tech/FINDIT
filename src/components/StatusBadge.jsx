import { getStatusTone } from '../utils/helpers.js';

/** Coloured pill for statuses — tone map lives in helpers. */
export default function StatusBadge({ status, children, className = '' }) {
  const tone = getStatusTone(status);
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      {children !== undefined ? children : status}
    </span>
  );
}
