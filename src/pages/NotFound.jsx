import { Link } from 'react-router-dom';
import Icon from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <div className="nf-wrap">
      <div className="not-found">
        <span className="not-found__code">404</span>
        <h1>Page not found</h1>
        <p>The page you are looking for doesn’t exist or was moved.</p>
        <Link to="/" className="btn btn--primary btn--lg">
          <Icon name="arrowLeft" size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
