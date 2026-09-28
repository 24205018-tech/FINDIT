/**
 * Simple localStorage helpers — kept for ImageUploader preview caching
 * All main data now comes from MySQL via src/services/api.js
 */

export function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`FindIt: failed to read "${key}" from localStorage`, err);
    return fallback;
  }
}

export function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`FindIt: failed to write "${key}"`, err);
    return false;
  }
}
