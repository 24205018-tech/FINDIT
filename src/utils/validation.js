/**
 * Client-side validation helpers shared by forms.
 * Each validator returns an error string (or null when valid).
 */

export const required = (value, label = 'This field') =>
  !value || !String(value).trim() ? `${label} is required.` : null;

export const minLength = (value, n, label = 'This field') =>
  value && String(value).trim().length < n ? `${label} must be at least ${n} characters.` : null;

export const maxLength = (value, n, label = 'This field') =>
  value && String(value).trim().length > n ? `${label} must be under ${n} characters.` : null;

export const isEmail = (value) =>
  value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? 'Enter a valid email address.' : null;

export const isPhone = (value) =>
  value && !/^[+()\d\s-]{8,15}$/.test(String(value).trim()) ? 'Enter a valid phone number.' : null;

export const isDate = (value, label = 'Date') => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? `Enter a valid ${label.toLowerCase()}.` : null;
};

export const notFuture = (value, label = 'Date') => {
  if (!value) return null;
  return new Date(value).getTime() > Date.now() + 86400000
    ? `${label} cannot be in the future.`
    : null;
};

export const matches = (a, b, label = 'Password') =>
  a && b && a !== b ? `${label}s do not match.` : null;

/** Validate one field with a list of rules; returns first error message */
export function validateField(rules, value) {
  for (const rule of rules) {
    const err = typeof rule === 'function' ? rule(value) : null;
    if (err) return err;
  }
  return null;
}

/** Validate an entire form model against its rules map */
export function validateForm(rulesMap, model) {
  const errors = {};
  Object.entries(rulesMap).forEach(([key, rules]) => {
    const err = validateField(rules, model[key]);
    if (err) errors[key] = err;
  });
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function firstError(errors) {
  return Object.values(errors)[0] || '';
}
