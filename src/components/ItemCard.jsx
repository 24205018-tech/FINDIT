import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import StatusBadge from './StatusBadge.jsx';
import { getCategoryColor, timeAgo } from '../utils/helpers.js';
import { itemImage, localPlaceholder, fallbackSrc } from '../utils/mockImage.js';

/**
 * ItemCard — responsive product-style card for search results,
 * recent reports, dashboard grids, etc.
 */
export default function ItemCard({ item, matchScore = null, footerExtra = null }) {
  if (!item) return null;
  const catColor = getCategoryColor(item.category);
  return (
    <article className="item-card">
      <Link
        className="item-card__thumb"
        to={`/item/${item.kind}/${item.id}`}
        aria-label={`View ${item.title}`}
      >
        <img
          src={item.imagePreview || itemImage(item.image)}
          data-seed={item.title}
          alt={item.title}
          loading="lazy"
          onError={fallbackSrc}
        />
        <span className="item-card__kind" data-kind={item.kind}>
          {item.kind === 'lost' ? 'Lost' : 'Found'}
        </span>
        {item.brand && item.brand !== '—' && (
          <span className="item-card__brand">{item.brand}</span>
        )}
        {matchScore !== null && (
          <span
            className="item-card__match"
            style={{
              background: matchScore >= 85 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : matchScore >= 70 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#64748b,#94a3b8)'
            }}
          >
            🔥 {matchScore}%
          </span>
        )}
      </Link>
      <div className="item-card__body">
        <span className="item-card__category" style={{ color: catColor }}>
          <span className="dot" style={{ background: catColor }} /> {item.category}
        </span>
        <Link to={`/item/${item.kind}/${item.id}`} className="item-card__title">
          {item.title}
        </Link>
        <p className="item-card__meta">
          <Icon name="pin" size={13} /> {item.location}
        </p>
        <p className="item-card__meta">
          <Icon name="calendar" size={13} /> {item.date} · {item.time}
        </p>
        <div className="item-card__row">
          <StatusBadge status={item.status} />
          <span className="item-card__ago">{timeAgo(item.createdAt)}</span>
        </div>
        <div className="item-card__footer">
          <Link to={`/item/${item.kind}/${item.id}`} className="btn btn--outline btn--sm">
            View Details
          </Link>
          {footerExtra}
        </div>
      </div>
    </article>
  );
}

export { localPlaceholder };
