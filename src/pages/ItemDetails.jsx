import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ItemCard from '../components/ItemCard.jsx';
import ClaimFormModal from '../components/ClaimFormModal.jsx';
import useItems from '../hooks/useItems.js';
import useAuth from '../hooks/useAuth.js';
import { computeMatchScore } from '../hooks/useMatches.js';
import { formatDateTime, getCategoryColor, colourValue, timeAgo } from '../utils/helpers.js';
import { fallbackSrc, itemImage } from '../utils/mockImage.js';

/**
 * ItemDetails — /item/:id  (legacy URL) and /item/:kind/:id.
 * Shows full details of a report + AI-style possible matches.
 * Sensitive ownership data is NEVER rendered on this public surface.
 */
export default function ItemDetails() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lostItems, foundItems, loading } = useItems();
  const [claimOpen, setClaimOpen] = useState(false);

  const isLost = kind === 'lost';
  const item = kind ? (isLost ? lostItems : foundItems).find((i) => i.id === id) : null;
  // legacy /item/:id handling — locate by id in either pool
  const fallbackItem = useMemo(
    () => (!kind ? [...lostItems, ...foundItems].find((i) => i.id === id) : null),
    [kind, id, lostItems, foundItems]
  );

  // possible matches against the opposite pool
  const possibleMatches = useMemo(() => {
    if (!item) return [];
    const pool = item.kind === 'lost' ? foundItems : lostItems;
    return pool
      .map((other) => {
        const score =
          item.kind === 'lost' ? computeMatchScore(item, other) : computeMatchScore(other, item);
        return { item: other, score };
      })
      .filter((m) => m.score >= 55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [item, lostItems, foundItems]);

  const similarItems = useMemo(() => {
    if (!item) return [];
    const pool = item.kind === 'lost' ? lostItems : foundItems;
    return pool
      .filter((i) => i.id !== item.id && i.category === item.category)
      .slice(0, 3);
  }, [item, lostItems, foundItems]);

  const goBack = useCallback(() => navigate(-1), [navigate]);

  if (loading) {
    return (
      <div className="page page--center">
        <LoadingSpinner label="Loading item details…" />
      </div>
    );
  }

  if (!item && fallbackItem) {
    return <Navigate to={`/item/${fallbackItem.kind}/${fallbackItem.id}`} replace />;
  }

  if (!item) {
    return (
      <div className="page page--center">
        <div className="not-found">
          <span className="not-found__code">404</span>
          <h2>Item not found</h2>
          <p>This report may have been removed or the link is incorrect.</p>
          <Link to="/search" className="btn btn--primary">
            <Icon name="search" size={16} /> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const catColor = getCategoryColor(item.category);
  const mine = user && item.userId === user.id;
  const available = item.status === 'Active' || item.status === 'Reported';

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={goBack}>
        <Icon name="arrowLeft" size={15} /> Back
      </button>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-gallery">
              <img
                src={item.imagePreview || itemImage(item.image)}
                data-seed={item.title}
                alt={item.title}
                onError={fallbackSrc}
                className="detail-gallery__img"
              />
              <span className="item-card__kind detail-gallery__kind" data-kind={item.kind}>
                {item.kind === 'lost' ? 'Lost Item' : 'Found Item'}
              </span>
            </div>

            <div className="detail-body">
              <div className="detail-body__top">
                <span className="detail-category" style={{ color: catColor }}>
                  <span className="dot" style={{ background: catColor }} /> {item.category}
                </span>
                {item.brand && item.brand !== '—' && (
                  <span className="detail-brand">{item.brand}</span>
                )}
              </div>
              <h1 className="detail-title">{item.title}</h1>
              <div className="detail-meta">
                <StatusBadge status={item.status} />
                <span className="detail-meta__item">
                  <Icon name="pin" size={15} /> {item.location}
                </span>
                <span className="detail-meta__item">
                  <Icon name="calendar" size={15} /> {formatDateTime(item.date, item.time)}
                </span>
              </div>

              {item.colour && item.colour !== '—' && (
                <p className="detail-colour">
                  Colour:{' '}
                  <span className="colour-chip" style={{ background: colourValue(item.colour) || '#94a3b8' }}>
                    {item.colour}
                  </span>
                </p>
              )}

              <h3 className="detail-h3">Description</h3>
              <p className="detail-desc">{item.description}</p>

              {item.details && (
                <>
                  <h3 className="detail-h3">Additional identifying details</h3>
                  <p className="detail-desc detail-desc--muted">
                    <Icon name="lock" size={13} /> Private detail — revealed to admins only for
                    ownership verification.
                  </p>
                  <p className="detail-desc">{item.details}</p>
                </>
              )}

              <div className="detail-alert">
                <Icon name="shield" size={18} />
                <p>
                  <strong>Identity protection:</strong> contact details of the reporter are never
                  displayed. If this is your item, submit a claim and the team will verify it
                  securely.
                </p>
              </div>
            </div>
          </div>

          {mine && (
            <div className="mine-banner">
              <Icon name="box" size={16} />
              <span>This is your report.</span>
              <Link to="/my-reports" className="btn btn--primary btn--sm">
                Manage Reports
              </Link>
            </div>
          )}
        </div>

        {/* aside */}
        <aside className="detail-aside">
          {available && (
            <div className="aside-card aside-card--cta">
              <h3>{item.kind === 'lost' ? 'Is this your item?' : 'Does this belong to you?'}</h3>
              <p>
                Submit a secure claim with hidden details or proof. FindIt's team verifies every
                claim before sharing contact info.
              </p>
              {user ? (
                <Button block icon="claim" onClick={() => setClaimOpen(true)}>
                  Claim This Item
                </Button>
              ) : (
                <Button block icon="lock" onClick={() => navigate('/login', { state: { from: `/item/${item.kind}/${item.id}` } })}>
                  Login to Claim
                </Button>
              )}
              <p className="aside-card__note">
                <Icon name="info" size={12} /> Fake claims with wrong details are auto-rejected.
              </p>
            </div>
          )}

          {item.kind === 'lost' && item.status !== 'Recovered' && item.status !== 'Claimed' && !mine && (
            <div className="aside-card">
              <h3>Seen it?</h3>
              <p>Help someone get their {item.category.toLowerCase()} back.</p>
              <Link to="/report-found" className="btn btn--outline btn--block">
                Report Similar Found Item
              </Link>
            </div>
          )}

          <div className="aside-card">
            <h3>Quick facts</h3>
            <dl className="facts">
              <div><dt>Category</dt><dd>{item.category}</dd></div>
              <div><dt>Colour</dt><dd>{item.colour || '—'}</dd></div>
              <div><dt>Brand</dt><dd>{item.brand || '—'}</dd></div>
              <div><dt>Location</dt><dd>{item.location}</dd></div>
              <div><dt>Reported</dt><dd>{timeAgo(item.createdAt)}</dd></div>
              <div><dt>Status</dt><dd>{item.status}</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      {/* possible matches */}
      <section className="detail-section">
        <div className="section-head section-head--row">
          <div>
            <span className="section-head__eyebrow">Smart matching engine</span>
            <h2>Possible Matches</h2>
          </div>
          <Link to="/matches" className="btn btn--ghost">
            View All Matches <Icon name="chevronRight" size={14} />
          </Link>
        </div>
        {possibleMatches.length === 0 ? (
          <div className="no-match">
            <span>🔍</span>
            <p>
              No close matches yet. When a matching {item.kind === 'lost' ? 'found' : 'lost'} report
              is filed, you'll be notified instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid--4">
            {possibleMatches.map((m) => (
              <article className="pm-card" key={m.item.id}>
                <Link to={`/item/${m.item.kind}/${m.item.id}`} className="pm-card__thumb">
                  <img
                    src={m.item.imagePreview || itemImage(m.item.image)}
                    data-seed={m.item.title}
                    alt={m.item.title}
                    loading="lazy"
                    onError={fallbackSrc}
                  />
                  <span className="pm-card__score">🔥 {m.score}%</span>
                </Link>
                <div className="pm-card__body">
                  <span className={m.item.kind === 'lost' ? 'badge badge--danger' : 'badge badge--success'}>
                    {m.item.kind === 'lost' ? 'Lost' : 'Found'}
                  </span>
                  <h4>{m.item.title}</h4>
                  <p>
                    <Icon name="pin" size={12} /> {m.item.location}
                  </p>
                  <div className="pm-bar">
                    <span style={{ width: `${m.score}%`, background: m.score >= 85 ? '#22c55e' : m.score >= 70 ? '#f59e0b' : '#94a3b8' }} />
                  </div>
                  <Link to={`/item/${m.item.kind}/${m.item.id}`} className="btn btn--outline btn--sm btn--block">
                    Compare
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {similarItems.length > 0 && (
        <section className="detail-section">
          <div className="section-head">
            <span className="section-head__eyebrow">Keep looking</span>
            <h2>Similar {item.category} reports</h2>
          </div>
          <div className="grid grid--3">
            {similarItems.map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}

      <ClaimFormModal open={claimOpen} onClose={() => setClaimOpen(false)} item={item} />
    </div>
  );
}
