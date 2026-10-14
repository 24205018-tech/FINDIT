import { NavLink, Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import Avatar from './Avatar.jsx';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { useNavigate } from 'react-router-dom';
import useUnreadMessages from '../hooks/useUnreadMessages.js';

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/report-lost', label: 'Report Lost', icon: 'plus' },
  { to: '/report-found', label: 'Report Found', icon: 'flag' },
  { to: '/search', label: 'Search Items', icon: 'search' },
  { to: '/my-reports', label: 'My Reports', icon: 'box' },
  { to: '/matches', label: 'Matches', icon: 'flame' },
  { to: '/claims', label: 'Claims', icon: 'claim' },
  { to: '/messages', label: 'Messages', icon: 'message' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/profile', label: 'Profile', icon: 'user' }
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/lost-items', label: 'Lost Items', icon: 'alert' },
  { to: '/admin/found-items', label: 'Found Items', icon: 'flag' },
  { to: '/admin/claims', label: 'Claims', icon: 'claim' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/heatmap', label: 'Heatmap', icon: 'map' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' }
];

/** Dashboard sidebar — student or admin link sets, collapsible on mobile */
export default function Sidebar({ open, onClose, admin = false }) {
  const { user, isAdmin, isTeacher, logout } = useAuth();
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(user?.id);
  const toast = useToast();
  const navigate = useNavigate();
  const links = admin ? ADMIN_LINKS : STUDENT_LINKS;

  const handleLogout = () => {
    logout();
    toast.show({ kind: 'success', title: 'Signed out', message: 'You have been logged out safely.' });
    navigate('/');
  };

  const backHome = admin
    ? { to: '/dashboard', label: 'My Dashboard', icon: 'user' }
    : { to: '/admin', label: 'Admin Panel', icon: 'shield' };

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label={`${admin ? 'Admin' : 'User'} navigation`}>
        <div className="sidebar__head">
          <Link to="/" className="brand" aria-label="FindIt home">
            <span className="brand__logo">
              <Icon name="search" size={17} />
            </span>
            <span className="brand__name">FindIt{admin && <em>Admin</em>}</span>
          </Link>
          <button type="button" className="icon-btn sidebar__close" aria-label="Close menu" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="sidebar__user">
          <Avatar name={user?.name} size={42} />
          <div className="sidebar__user-meta">
            <strong>{user?.name}</strong>
            <span className="sidebar__user-role">{user?.role === 'admin' ? 'Administrator' : user?.role === 'teacher' ? 'Teacher account' : 'Student account'}</span>
          </div>
          <span className={`role-chip ${user?.role === 'admin' ? 'role-chip--admin' : ''}`}>
            {user?.role === 'admin' ? 'Admin' : user?.role === 'teacher' ? 'Teacher' : 'Student'}
          </span>
        </div>

        <nav className="sidebar__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={Boolean(l.end)}
              className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
              onClick={onClose}
            >
              <Icon name={l.icon} size={17} />
              <span>{l.label}</span>
              {l.to === '/messages' && unreadMessagesCount > 0 && (
                <span className="badge badge--danger sidebar__badge">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </NavLink>
          ))}
          {isAdmin && !admin && (
            <NavLink to="/admin" className="sidebar__link sidebar__link--switch">
              <Icon name="shield" size={17} />
              <span>Admin Panel</span>
              <Icon name="chevronRight" size={13} className="sidebar__arrow" />
            </NavLink>
          )}
          {admin && (
            <NavLink to="/dashboard" className="sidebar__link sidebar__link--switch">
              <Icon name="user" size={17} />
              <span>My Dashboard</span>
              <Icon name="chevronRight" size={13} className="sidebar__arrow" />
            </NavLink>
          )}
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__help">
            <Icon name="zap" size={15} />
            <p>
              <strong>Need help?</strong>
              <span>support@findit.edu</span>
            </p>
          </div>
          <button type="button" className="sidebar__logout" onClick={handleLogout}>
            <Icon name="logout" size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
