import Icon from './Icons.jsx';
import { avatarFor } from '../utils/mockImage.js';

/** Round avatar — photos come from DiceBear, fallback to initials. */
export default function Avatar({ name = '', src = '', size = 40, className = '' }) {
  const url = src || avatarFor(name || 'Guest');
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.34) };
  return (
    <span
      className={`avatar ${className}`.trim()}
      style={style}
      onError={(e) => {
        e.currentTarget.textContent = (name || 'G')
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        e.currentTarget.style.background = 'linear-gradient(135deg,#4f46e5,#7c3aed)';
      }}
    >
      {src ? <img src={src} alt={name} referrerPolicy="no-referrer" /> : null}
    </span>
  );
}
