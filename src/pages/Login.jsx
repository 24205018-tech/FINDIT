import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import GoogleAuthButton from '../components/GoogleAuthButton.jsx';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { isEmail, required } from '../utils/validation.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '', role: 'student', remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {
      email: required(form.email, 'Email') || isEmail(form.email),
      password: required(form.password, 'Password')
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setBusy(true);
    login(form.email, form.password, form.role)
      .then((user) => {
        toast.show({
          kind: 'success',
          title: `Welcome back, ${user.name.split(' ')[0]}!`,
          message: 'You are now signed in.'
        });
        navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
      })
      .catch((err) => {
        toast.show({ kind: 'error', title: 'Login failed', message: err.message });
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-aside" aria-hidden="true">
        <Link to="/" className="brand brand--light">
          <span className="brand__logo">
            <Icon name="search" size={17} />
          </span>
          <span className="brand__name">FindIt</span>
        </Link>
        <div className="auth-aside__content">
          <h2>Reunited with your stuff, faster.</h2>
          <p>
            One account to report, match, claim and recover — across the whole campus.
          </p>
          <div className="auth-aside__quote">
            <blockquote>
              “Reported my smartwatch at 2:30 PM. FindIt matched it by 6 PM the same day.
              Got it back within 24 hours!”
            </blockquote>
            <cite>— Arjun S., final year</cite>
          </div>
        </div>
        <div className="auth-aside__dots" />
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <header className="auth-card__head">
            <h1>Welcome back 👋</h1>
            <p>Log in to track your reports and possible matches.</p>
          </header>

          <GoogleAuthButton
            role={form.role}
            mode="login"
            onSuccess={(user) => {
              toast.show({
                kind: 'success',
                title: `Welcome back, ${user.name.split(' ')[0]}!`,
                message: 'You are now signed in with Google.',
              });
              navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
            }}
            onError={(err) => {
              toast.show({ kind: 'error', title: 'Google sign-in failed', message: err.message });
            }}
          />

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="login-role">Account type <span className="field__req">*</span></label>
              <div className="input-wrap">
                <span className="input-wrap__icon"><Icon name="users" size={16} /></span>
                <select
                  id="login-role"
                  name="role"
                  className="input input--with-icon"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                >
                  <option value="student">User / Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Input
              label="Email address"
              type="email"
              name="email"
              placeholder="you@student.edu"
              autoComplete="email"
              icon={<Icon name="mail" size={16} />}
              value={form.email}
              error={errors.email}
              required
              onChange={(e) => setField('email', e.target.value)}
            />
            <div className="field">
              <div className="field__label-row">
                <label className="field__label" htmlFor="password">
                  Password <span className="field__req">*</span>
                </label>
                <button type="button" className="link-btn" onClick={() => toast.show({ kind: 'info', title: 'Reset link sent', message: 'Password reset links are simulated in this frontend prototype.' })}>
                  Forgot password?
                </button>
              </div>
              <div className={`input-wrap ${errors.password ? 'input-wrap--error' : ''}`}>
                <span className="input-wrap__icon">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  className={`input input--with-icon ${showPassword ? '' : 'input--pr'}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(e) => setField('password', e.target.value)}
                />
                <button
                  type="button"
                  className="input-wrap__toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
              {errors.password && (
                <p className="field__error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setField('remember', e.target.checked)}
              />
              <span>Remember me for 30 days</span>
            </label>

            <Button type="submit" block size="lg" loading={busy} icon="logout">
              {busy ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <p className="auth-card__switch">
            New to FindIt? <Link to="/register">Create an account</Link>
          </p>
          <Link to="/" className="auth-card__home">
            <Icon name="arrowLeft" size={14} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
