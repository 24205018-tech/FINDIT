import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import StatusBadge from './StatusBadge.jsx';
import ProgressBar from './ProgressBar.jsx';
import { timeDiffLabel } from '../utils/helpers.js';

/** Colour for a match percentage */
export function matchColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#94a3b8';
}

export function matchTier(score) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Possible';
  return 'Low';
}

/**
 * MatchCard — displays one lost↔found candidate pair with an
 * animated percentage ring, tier badge and CTA.
 */
export default function MatchCard({ match, onView = null, onClaim = null, claimed = false }) {
  const { lostItem, foundItem, score = 0 } = match;
  if (!lostItem || !foundItem) return null;
  const R = 26;
  const C = 2 * Math.PI * R;
  const color = matchColor(score);
  const tier = matchTier(score);
  const diff = timeDiffLabel(lostItem.createdAt, foundItem.createdAt);

  return (
    <article className="match-card">
      <div className="match-card__score">
        <svg width="72" height="72" viewBox="0 0 72 72" className="ring">
          <circle className="ring__bg" cx="36" cy="36" r={R} />
          <circle
            className="ring__fg"
            cx="36"
            cy="36"
            r={R}
            strokeDasharray={`${(score / 100) * C} ${C}`}
            style={{ stroke: color }}
          />
          <text x="36" y="39" textAnchor="middle" dominantBaseline="middle" className="ring__score" fill="#fff">
            {score}
            <tspan fontSize="9" fill="#94a3b8">%</tspan>
          </text>
        </svg>
        <span className="badge" style={{ background: color, color: '#fff' }}>
          {tier} Match
        </span>
      </div>

      <div className="match-card__pair">
        <div className="match-card__side">
          <span className="badge badge--danger">Lost</span>
          <strong className="match-card__title">{lostItem.title}</strong>
          <p className="match-card__meta">
            <Icon name="pin" size={13} /> {lostItem.location}
          </p>
          <p className="match-card__meta">
            <Icon name="tag" size={13} /> {lostItem.category} · {lostItem.colour || '—'}
          </p>
        </div>
        <span className="match-card__arrow">⇄</span>
        <div className="match-card__side">
          <span className="badge badge--success">Found</span>
          <strong className="match-card__title">{foundItem.title}</strong>
          <p className="match-card__meta">
            <Icon name="pin" size={13} /> {foundItem.location}
          </p>
          <p className="match-card__meta">
            <Icon name="tag" size={13} /> {foundItem.category} · {foundItem.colour || '—'}
          </p>
        </div>
      </div>

      <div className="match-card__footer">
        <div className="match-card__reason">
          <Icon name="clock" size={13} /> Reported {diff}
          {match.reason && <p className="match-card__reason-text">{match.reason}</p>}
        </div>
        <div className="match-card__actions">
          {onClaim && !claimed && (
            <button type="button" className="btn btn--outline btn--sm" onClick={() => onClaim(match)}>
              <Icon name="claim" size={14} /> Claim
            </button>
          )}
          {claimed && <span className="match-card__claimed">✓ Claimed</span>}
          {onView ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => onView(match)}>
              View Match <Icon name="chevronRight" size={14} />
            </button>
          ) : (
            <Link className="btn btn--primary btn--sm" to={`/item/${lostItem.kind === 'lost' ? 'lost' : 'found'}/${lostItem.id}`}>
              View Item <Icon name="chevronRight" size={14} />
            </Link>
          )}
        </div>
      </div>

      <ProgressBar value={score} color={color} className="match-card__bar" />
    </article>
  );
}
