/**
 * Image handling for the frontend milestone.
 * Item photos are rendered from local /items/ asset files (photographer-style
 * stock pictures). DiceBear SVG avatars (a public URL service) are used for
 * user photos. When no image exists we fall back to a fully offline,
 * local SVG placeholder so nothing ever looks broken offline.
 */

const SVG_ENCODER = typeof window !== 'undefined' ? window.encodeURIComponent : encodeURIComponent;

/** Deterministic avatar: params are baked into the URL so it is cache friendly */
export function avatarFor(name, variant = 'initials') {
  const url = `https://api.dicebear.com/7.x/initials/svg?seed=${SVG_ENCODER(String(name || 'User').replace(/\s+/g, '%20'))}`;
  if (variant === 'initials') return url;
  const style = variant === 'bottts' ? 'bottts' : 'thumbs';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${SVG_ENCODER(String(name || 'guest').replace(/\s+/g, '%20'))}`;
}

/** Local static asset used for an item */
export function itemImage(seed = '') {
  return `/items/${String(seed)}.jpg`;
}

/** Offline placeholder so any image-less or broken item still looks clean */
export function localPlaceholder(seed = '') {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  const hues = [45, 210, 150, 280, 340, 190, 25];
  const hue = hues[h % hues.length];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${hue} 55% 88%)'/>` +
    `<stop offset='1' stop-color='hsl(${hue} 55% 70%)'/></linearGradient></defs>` +
    `<rect width='200' height='200' fill='url(#g)'/>` +
    `<g opacity='0.5' fill='hsl(${hue} 45% 55%)'>` +
    `<path d='M40 130q15-38 45-40 26-2 38 26 8 18 32 12v42H40z'/>` +
    `<path d='M120 60l20-14 14 20-24 10z'/>` +
    `<circle cx='152' cy='44' r='12'/></g>` +
    `<circle cx='140' cy='50' r='6' fill='hsl(${hue} 60% 45%)'/></svg>`;
  return `data:image/svg+xml,${SVG_ENCODER(svg)}`;
}

/** On <img> error, replace src with the offline placeholder */
export function fallbackSrc(e) {
  const img = e.currentTarget;
  const finalFallback = img.dataset.fallback || localPlaceholder(img.dataset.seed || 'FindIt');
  if (!img.dataset.fallback) {
    img.dataset.fallback = finalFallback;
    img.src = finalFallback;
  }
}
