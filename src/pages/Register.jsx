import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { isEmail, isPhone, matches, minLength, required } from '../utils/validation.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {
      name: required(form.name, 'Full name') || minLength(form.name, 3, 'Full name'),
      email: required(form.email, 'Email') || isEmail(form.email),
      phone: required(form.phone, 'Phone number') || isPhone(form.phone),
      password: required(form.password, 'Password') || minLength(form.password, 6, 'Password'),
      confirmPassword:
        required(form.confirmPassword, 'Confirm password') ||
        matches(form.password, form.confirmPassword, 'Password')
    };
    if (!terms) errs.terms = 'Please accept the terms to continue.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.show({ kind: 'error', title: 'Check the form', message: 'Some fields need your attention.' });
      return;
    }

    setBusy(true);
    register(form)
      .then(() => {
        toast.show({
          kind: 'success',
          title: 'Account created 🎉',
          message: 'Registration successful — log in with your new credentials.'
        });
        navigate('/login');
      })
      .catch((err) => {
        // Handle field-specific validation errors from backend
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          const fieldMap = {};
          err.fieldErrors.forEach(e => {
            const field = e.field || e.path;
            if (field) fieldMap[field] = e.message || e.msg;
          });
          setErrors(prev => ({ ...prev, ...fieldMap, email: fieldMap.email || err.message }));
        } else {
          setErrors((er) => ({ ...er, email: err.message }));
        }
        // Show specific message: duplicate, validation, or backend down
        let displayMsg = err.message;
        if (err.status === 409) displayMsg = err.message; // duplicate
        else if (err.status === 400) displayMsg = err.message;
        else if (!err.status) displayMsg = 'Backend not reachable. Start the backend first: open a terminal, run  cd backend && npm start  (it must say running on port 5000)';
        toast.show({ kind: 'error', title: 'Registration failed', message: displayMsg });
      })
      .finally(() => setBusy(false));
  };

  const strength = Math.min(
    4,
    (form.password.length >= 6 ? 1 : 0) +
      (/[A-Z]/.test(form.password) ? 1 : 0) +
      (/\d/.test(form.password) ? 1 : 0) +
      (form.password.length >= 10 ? 1 : 0)
  );

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e'][strength];

  return (
    <div className="auth-page">
      <div className="auth-aside auth-aside--alt" aria-hidden="true">
        <Link to="/" className="brand brand--light">
          <span className="brand__logo">
            <Icon name="search" size={17} />
          </span>
          <span className="brand__name">FindIt</span>
        </Link>
        <div className="auth-aside__content">
          <h2>Join the smartest lost &amp; found on campus.</h2>
          <ul className="auth-aside__list">
            <li>
              <Icon name="checkCircle" size={16} /> Report items in under two minutes
            </li>
            <li>
              <Icon name="checkCircle" size={16} /> Get instant match notifications
            </li>
            <li>
              <Icon name="checkCircle" size={16} /> Claim securely with verification
            </li>
          </ul>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <header className="auth-card__head">
            <h1>Create your account</h1>
            <p>It takes less than a minute. No spam, ever.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Full name"
              name="name"
              placeholder="e.g. Ananya Gupta"
              autoComplete="name"
              icon={<Icon name="user" size={16} />}
              value={form.name}
              error={errors.name}
              required
              onChange={(e) => setField('name', e.target.value)}
            />
            <div className="row-2">
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
              <Input
                label="Phone"
                type="tel"
                name="phone"
                placeholder="+91 98XXX XXXXX"
                autoComplete="tel"
                icon={<Icon name="phone" size={16} />}
                value={form.phone}
                error={errors.phone}
                required
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              icon={<Icon name="lock" size={16} />}
              toggle={{ show: showPassword, setShow: setShowPassword }}
              value={form.password}
              error={errors.password}
              required
              onChange={(e) => setField('password', e.target.value)}
            />
            {form.password && (
              <div className="strength">
                <div className="strength__bar">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={i <= strength ? 'is-on' : ''}
                      style={{ background: i <= strength ? strengthColor : '' }}
                    />
                  ))}
                </div>
                <span style={{ color: strengthColor }}>
                  {strengthLabel} {form.password.length < 6 && `— ${6 - form.password.length} more chars`}
                </span>
              </div>
            )}
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              icon={<Icon name="lock" size={16} />}
              toggle={{ show: showConfirm, setShow: setShowConfirm }}
              value={form.confirmPassword}
              error={errors.confirmPassword}
              required
              onChange={(e) => setField('confirmPassword', e.target.value)}
            />

            <label className={`checkbox ${errors.terms ? 'checkbox--error' : ''}`}>
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              </span>
            </label>

            <Button type="submit" block size="lg" loading={busy} icon="plus">
              {busy ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="auth-card__switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          <Link to="/" className="auth-card__home">
            <Icon name="arrowLeft" size={14} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
