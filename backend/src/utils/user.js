export function publicUser(u) {
  if (!u) return null;
  const obj = u.toObject ? u.toObject({ virtuals: true }) : u;
  const id = obj._id ? obj._id.toString() : (obj.id || '');
  const createdAt = obj.createdAt || obj.created_at || new Date().toISOString();
  const updatedAt = obj.updatedAt || obj.updated_at || createdAt;

  return {
    id,
    _id: obj._id || id,
    name: obj.name || '',
    email: obj.email || '',
    phone: obj.phone || '',
    role: obj.role || 'student',
    department: obj.department || 'General',
    designation: obj.designation || (obj.role === 'admin' ? 'System Administrator' : obj.role === 'teacher' ? 'Teacher' : 'Student'),
    photo: obj.photo || '',
    google_id: obj.google_id || '',
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}
