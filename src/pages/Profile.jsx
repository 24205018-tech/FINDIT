import { useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icons.jsx';
import Avatar from '../components/Avatar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { isEmail, isPhone, required } from '../utils/validation.js';
import { formatDate } from '../utils/helpers.js';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const photoRef = useRef(null);

  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    rollNo: user?.rollNo || '',
    department: user?.department || '',
    photo: user?.photo || ''
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [prefs, setPrefs] = useState(() => ({
    emailMatches: true,
    emailClaims: true,
    weeklyDigest: false
  }));

  if (!user) return null;

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.show({ kind: 'error', title: 'Photo', message: 'Please choose an image file.' });
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.show({ kind: 'error', title: 'Photo', message: 'Image must be under 1.5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('photo', reader.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const errs = {
      name: required(form.name, 'Full name'),
      email: required(form.email, 'Email') || isEmail(form.email),
      phone: required(form.phone, 'Phone') || isPhone(form.phone)
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.show({ kind: 'error', title: 'Check the form', message: 'Please fix the highlighted fields.' });
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        photo: form.photo
      });
      setEditing(false);
      toast.show({ kind: 'success', title: 'Profile updated', message: 'Your changes were saved to MongoDB.' });
    } catch (err) {
      toast.show({ kind: 'error', title: 'Update failed', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const joined = formatDate(user.created_at?.slice(0,10) || user.joinedAt || user.createdAt?.slice(0,10));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        subtitle="View and manage your FindIt account details — synced with MongoDB."
        actions={
          editing ? (
            <div className="row-actions">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); }}>Cancel</Button>
              <Button size="sm" icon="check" loading={busy} onClick={save}>Save Changes</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" icon="edit" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )
        }
      />

      <div className="profile-layout">
        <aside className="profile-card-side">
          <Card>
            <div className="profile-card-side__head">
              <div className="profile-photo">
                <Avatar name={user.name} src={form.photo || user.photo} size={96} />
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
                {editing && (
                  <button
                    type="button"
                    className="profile-photo__edit"
                    aria-label="Change photo"
                    onClick={() => photoRef.current?.click()}
                  >
                    <Icon name="camera" size={14} />
                  </button>
                )}
              </div>
              <h2>{form.name}</h2>
              <p>{form.email}</p>
              <StatusBadge status={user.role === 'admin' ? 'Admin' : 'Active'} className="mt-4" />
            </div>
            <dl className="facts facts--side">
              <div><dt>Account type</dt><dd>{user.role === 'admin' ? 'Administrator' : 'Student'}</dd></div>
              <div><dt>Joined</dt><dd>{joined}</dd></div>
              <div><dt>Phone</dt><dd>{form.phone || '—'}</dd></div>
              <div><dt>Account ID</dt><dd className="mono">{user.id}</dd></div>
            </dl>
          </Card>

          <Card title="Preferences" icon="settings">
            {[
              { key: 'emailMatches', label: 'New match alerts', hint: 'Email me when something may match my reports' },
              { key: 'emailClaims', label: 'Claim updates', hint: 'Status changes on my claims' },
              { key: 'weeklyDigest', label: 'Weekly digest', hint: 'A summary of campus lost & found activity' }
            ].map((p) => (
              <label className="pref-row" key={p.key}>
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={prefs[p.key]}
                    onChange={(e) => {
                      setPrefs((pr) => ({ ...pr, [p.key]: e.target.checked }));
                      toast.show({ kind: 'success', title: 'Preference saved', message: `${p.label} ${e.target.checked ? 'enabled' : 'disabled'}.`, duration: 1800 });
                    }}
                  />
                  <i />
                </span>
                <span>
                  <strong>{p.label}</strong>
                  <em>{p.hint}</em>
                </span>
              </label>
            ))}
          </Card>

          <Card>
            <div className="danger-zone">
              <h4>Session</h4>
              <p>Sign out from this device. You can log back in anytime.</p>
              <Button variant="outline" size="sm" icon="logout" onClick={logout}>
                Logout
              </Button>
            </div>
          </Card>
        </aside>

        <div className="profile-card-main">
          <Card
            title={editing ? 'Edit details' : 'Personal information'}
            icon="user"
            subtitle={editing ? 'Make sure your contact details are accurate.' : 'Details stored in MongoDB and visible to the FindIt team for claim verification.'}
          >
            <div className="profile-form">
              <Input
                label="Full name"
                value={form.name}
                error={errors.name}
                required
                disabled={!editing}
                onChange={(e) => setField('name', e.target.value)}
              />
              <div className="row-2">
                <Input
                  label="Email address"
                  type="email"
                  value={form.email}
                  error={errors.email}
                  required
                  disabled={true}
                  onChange={(e) => setField('email', e.target.value)}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  error={errors.phone}
                  required
                  disabled={!editing}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>
              <div className="row-2">
                <Input label="Roll / Registration no." placeholder="e.g. 2023CS45" value={form.rollNo} disabled={!editing} onChange={(e) => setField('rollNo', e.target.value)} />
                <Input label="Department" placeholder="e.g. Computer Science" value={form.department} disabled={!editing} onChange={(e) => setField('department', e.target.value)} />
              </div>

              {editing && (
                <div className="profile-form__note">
                  <Icon name="shield" size={15} />
                  <p>
                    Profile changes are now persisted to MongoDB via PUT /api/auth/profile — your name and phone are updated in the users collection.
                  </p>
                </div>
              )}

              <hr className="form-divider" />
              <h4 className="security-title">Security</h4>
              <div className="row-2">
                <Button
                  variant="outline"
                  icon="lock"
                  onClick={() => toast.show({ kind: 'info', title: 'Change password', message: 'Use PUT /api/auth/change-password with current and new password.' })}
                >
                  Change Password
                </Button>
                <Button
                  variant="ghost"
                  icon="phone"
                  onClick={() => toast.show({ kind: 'info', title: 'Two-factor', message: '2FA can be added as an extra column in users table.' })}
                >
                  Enable 2FA
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
