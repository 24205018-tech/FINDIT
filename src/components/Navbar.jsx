import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icons.jsx';
import Avatar from './Avatar.jsx';
import useAuth from '../hooks/useAuth.js';
import NotificationsBell from './NotificationsBell.jsx';
import { useOutsideClick } from '../hooks/useUi.js';
import { useState } from 'react';
import { useToast } from '../hooks/useToast.jsx';

/** Top navigation bar for public pages */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useOutsideClick(() => setOpen(false));

  const links = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/search', label: 'Search' },
        { to: '/matches', label: 'Smart Matches' },
        { to: '/report-lost', label: 'Report Lost' },
        { to: '/report-found', label: 'Report Found' }
      ]
    : [
        { to: '/search', label: 'Browse' },
        { to: '/matches', label: 'Smart Matches' }
      ];

  const handleLogout = () => {
    logout();
    toast.show({ kind: 'success', title: 'Signed out', message: 'You have been logged out safely.' });
    navigate('/');
    setOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="brand" aria-label="FindIt home">
          <span className="brand__logo">
            <Icon name="search" size={17} />
          </span>
          <span className="brand__name">FindIt</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/dashboard'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          {isAuthenticated && <NotificationsBell compact />}
          {isAuthenticated ? (
            <div className="navbar__user" ref={menuRef}>
              <button
                type="button"
                className="navbar__user-btn"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
              >
                <Avatar name={user.name} size={34} />
                <span className="navbar__user-meta">
                  <strong>{user.name.split(' ')[0]}</strong>
                  <em>{isAdmin ? 'Administrator' : 'Student'}</em>
                </span>
                <Icon name="chevronDown" size={14} />
              </button>
              {open && (
                <div className="dropdown" role="menu">
                  <div className="dropdown__user">
                    <Avatar name={user.name} size={40} />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <Link to="/profile" className="dropdown__item" onClick={() => setOpen(false)}>
                    <Icon name="user" size={16} /> My Profile
                  </Link>
                  <Link to="/my-reports" className="dropdown__item" onClick={() => setOpen(false)}>
                    <Icon name="box" size={16} /> My Reports
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="dropdown__item" onClick={() => setOpen(false)}>
                      <Icon name="shield" size={16} /> Admin Panel
                    </Link>
                  )}
                  <div className="dropdown__sep" />
                  <button type="button" className="dropdown__item dropdown__item--danger" onClick={handleLogout}>
                    <Icon name="logout" size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn--ghost btn--sm">
                Login
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Register
              </Link>
            </div>
          )}
          <button
            type="button"
            className="icon-btn navbar__burger"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="navbar__mobile" aria-label="Mobile">
          <Link to="/" onClick={() => setOpen(false)}>
            <Icon name="dashboard" size={15} /> Home
          </Link>
          {!isAuthenticated && (
            <Link to="/register" onClick={() => setOpen(false)}>
              <Icon name="user" size={15} /> Register
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/login" onClick={() => setOpen(false)}>
              <Icon name="lock" size={15} /> Login
            </Link>
          )}
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              <Icon name="chevronRight" size={15} /> {l.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button type="button" onClick={handleLogout}>
              <Icon name="logout" size={15} /> Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
