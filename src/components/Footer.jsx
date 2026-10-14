import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';

/** Professional footer — landing & public pages */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top container">
        <div className="footer__brand">
          <Link to="/" className="brand brand--light">
            <span className="brand__logo">
              <Icon name="search" size={17} />
            </span>
            <span className="brand__name">FindIt</span>
          </Link>
          <p>
            FindIt is an intelligent lost &amp; found management system that reconnects people with
            their belongings through smart item matching.
          </p>
          <div className="footer__social">
            {['globe', 'mail', 'phone'].map((s) => (
              <span className="footer__social-btn" key={s} aria-hidden="true">
                <Icon name={s === 'globe' ? 'grid' : s} size={15} />
              </span>
            ))}
          </div>
        </div>

        <div className="footer__col">
          <h4>Quick Links</h4>
          <Link to="/search">Search Items</Link>
          <Link to="/report-lost">Report Lost Item</Link>
          <Link to="/report-found">Report Found Item</Link>
          <Link to="/matches">Smart Matches</Link>
        </div>
        <div className="footer__col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/admin">Admin Panel</Link>
        </div>
        <div className="footer__col">
          <h4>Contact</h4>
          <p>
            <Icon name="pin" size={14} /> Campus Security Office,
            <br /> Academic Block, 2nd Floor
          </p>
          <p>
            <Icon name="mail" size={14} /> support@findit.edu
          </p>
          <p>
            <Icon name="phone" size={14} /> +91 98220 10001
          </p>
        </div>
      </div>
      <div className="footer__bottom container">
        <p>© 2026 FindIt · Intelligent Lost &amp; Found Management System — Frontend Prototype</p>
        <p>Made with ❤ for college project demonstration</p>
      </div>
    </footer>
  );
}
