// Account seed data is intentionally empty.
// FindIt is frontend-only in this build: accounts are created through
// the Register page and stored in browser localStorage.
export const DEFAULT_ADMIN = null;
export const DEFAULT_TEACHERS = [];
export const DEFAULT_STUDENTS = [];
export const DEFAULT_USERS = [];

export function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}
