import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Sidebar from './Sidebar.jsx';
import NotificationsBell from './NotificationsBell.jsx';
import Icon from './Icons.jsx';
import useAuth from '../hooks/useAuth.js';
import useUnreadMessages from '../hooks/useUnreadMessages.js';
import Avatar from './Avatar.jsx';

/** Public pages: navbar + content + footer */
export function PublicLayout({ children }) {
  return (
    <div className="app public">
      <Navbar />
      <main className="public-main">{children}</main>
      <Footer />
    </div>
  );
}

/** Authenticated app shell: collapsible sidebar + topbar + content */
export function DashboardLayout({ children, admin = false }) {
  const { user } = useAuth();
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        admin={admin}
      />
      <div className="shell-main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="topbar-btn topbar-hamburger"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={21} />
            </button>
            <Link to={admin ? '/admin' : '/dashboard'} className="brand topbar__brand" aria-label="FindIt home">
              <span className="brand__logo">
                <Icon name="search" size={16} />
              </span>
              <span className="brand__name">FindIt</span>
            </Link>
            <span className="topbar__crumb">{admin ? 'Admin Panel' : 'My Space'}</span>
          </div>
          <div className="topbar__right">
            <NotificationsBell />
            <Link
              to="/messages"
              className="topbar-btn topbar-msg-btn"
              aria-label={`Messages (${unreadMessagesCount} unread)`}
              title="Private Messages"
            >
              <Icon name="message" size={19} />
              {unreadMessagesCount > 0 && (
                <span className="notif-bell__bubble">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link to="/profile" className="topbar__avatar" aria-label="Profile">
              <Avatar name={user?.name} size={36} />
            </Link>
          </div>
        </header>
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
