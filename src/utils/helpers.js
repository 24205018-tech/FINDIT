/**
 * FindIt utility helpers.
 * The functions in this file intentionally mirror what a REST API client
 * would do later — swap their bodies with fetch() calls when the backend
 * milestone begins.
 */

const pad = (n) => String(n).padStart(2, '0');

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const m = String(timeStr).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return timeStr;
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${m[2]} ${ampm}`;
}

export function formatDateTime(dateStr, timeStr) {
  return `${formatDate(dateStr)} • ${formatTime(timeStr)}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
}

export function timeDiffLabel(lostTime, foundTime) {
  // Format: "YYYY-MM-DD HH:mm" strings -> human friendly difference
  const toMin = (s) => {
    if (!s) return null;
    const m = String(s).match(/^(\d{4}-\d{2}-\d{2})T?(\d{2}):(\d{2})/);
    if (m) return new Date(`${m[1]}T${m[2]}:${m[3]}`).getTime() / 60000;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.getTime() / 60000;
  };
  const a = toMin(lostTime);
  const b = toMin(foundTime);
  if (a == null || b == null) return 'reported recently';
  const diff = Math.abs(a - b);
  const mins = Math.round(diff);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} apart`;
  if (mins < 1440) return `${Math.round(mins / 60)} hour${Math.round(mins / 60) !== 1 ? 's' : ''} apart`;
  return `${Math.round(mins / 1440)} day${Math.round(mins / 1440) !== 1 ? 's' : ''} apart`;
}

export function categoryOptions() {
  return [
    'ID Card', 'Wallet', 'Phone', 'Laptop', 'Watch', 'Earbuds',
    'Keys', 'Bag', 'Documents', 'Jewellery', 'Electronics', 'Other'
  ];
}

export function getStatusTone(status) {
  const map = {
    Pending: 'warn',
    'Under Review': 'info',
    Approved: 'success',
    Rejected: 'danger',
    Recovered: 'success',
    Reported: 'info',
    Active: 'info',
    Claimed: 'success',
    Resolved: 'success',
    Closed: 'danger',
    Lost: 'danger',
    Found: 'info',
    Open: 'success',
    'Possible Match': 'match'
  };
  return map[status] || 'neutral';
}

export function getCategoryIcon(category) {
  const map = {
    'ID Card': 'card',
    Wallet: 'wallet',
    Phone: 'phone',
    Laptop: 'laptop',
    Watch: 'watch',
    Earbuds: 'earbuds',
    Keys: 'keys',
    Bag: 'bag',
    Documents: 'docs',
    Jewellery: 'ring',
    Electronics: 'electronics',
    Other: 'tag'
  };
  return map[category] || 'tag';
}

export function getCategoryColor(category) {
  const map = {
    'ID Card': '#6366f1',
    Wallet: '#f59e0b',
    Phone: '#10b981',
    Laptop: '#3b82f6',
    Watch: '#8b5cf6',
    Earbuds: '#14b8a6',
    Keys: '#ef4444',
    Bag: '#a855f7',
    Documents: '#0ea5e9',
    Jewellery: '#ec4899',
    Electronics: '#64748b',
    Other: '#6b7280'
  };
  return map[category] || '#6b7280';
}

/** Dice-bear style helper: returns a colouring key per seed */
export function seedKey(seed = '') {
  const palette = ['#4f46e5', '#0891b2', '#ea580c', '#16a34a', '#9333ea', '#e11d48'];
  let hash = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/** Attach a colour swatch for a generic named colour string */
export function colourValue(colourName) {
  if (!colourName) return null;
  const map = {
    Black: '#111827',
    White: '#e5e7eb',
    Blue: '#2563eb',
    'Dark Blue': '#1e3a8a',
    Red: '#dc2626',
    Green: '#16a34a',
    Grey: '#6b7280',
    'Grey / Green': '#5b7c63',
    Brown: '#92400e',
    Pink: '#ec4899',
    Silver: '#cbd5e1',
    'Light Pink': '#fbcfe8',
    Gold: '#d4a017',
    Purple: '#7c3aed',
    Orange: '#ea580c',
    'Teal / Green': '#0f766e',
    Yellow: '#eab308',
    Beige: '#d6c7a1',
    Rose: '#f43f5e',
    Multicolour: '#f97316'
  };
  return map[colourName] || '#64748b';
}

export function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
