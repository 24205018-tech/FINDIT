import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import MatchCard, { matchTier } from '../components/MatchCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icons.jsx';
import ClaimFormModal from '../components/ClaimFormModal.jsx';
import useMatches from '../hooks/useMatches.js';
import useAuth from '../hooks/useAuth.js';

const FILTERS = [
  { id: 'All', label: 'All', icon: 'grid' },
  { id: 'Strong', label: 'Strong Match', icon: 'flame' },
  { id: 'Possible', label: 'Possible Match', icon: 'zap' },
  { id: 'Low', label: 'Low Match', icon: 'search' }
];

/**
 * Smart Matches — AI-style candidate pairs between lost and found reports,
 * filterable by match strength.
 */
export default function Matches() {
  const { user } = useAuth();
  const { matches, loading: matchLoading } = useMatches();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [viewed, setViewed] = useState({});
  const [claimItem, setClaimItem] = useState(null);

  // Signed-in students see matches involving their own reports only;
  // admins and public visitors browse the full campus pairing feed.
  const visibleMatches = useMemo(() => {
    if (!user || user.role === 'admin') return matches;
    return matches.filter(
      (m) => m.lostItem?.userId === user.id || m.foundItem?.userId === user.id
    );
  }, [matches, user]);

  const filtered = useMemo(() => {
    if (filter === 'All') return visibleMatches;
    return visibleMatches.filter((m) => matchTier(m.score) === filter);
  }, [visibleMatches, filter]);

  const counts = useMemo(() => {
    const c = { All: visibleMatches.length, Strong: 0, Possible: 0, Low: 0 };
    visibleMatches.forEach((m) => {
      c[matchTier(m.score)] += 1;
    });
    return c;
  }, [visibleMatches]);

  const handleView = (m) => {
    setViewed((v) => ({ ...v, [m.id]: true }));
    // owners land on the found item page — that is where claiming happens
    const target = m.lostItem?.userId === user?.id && m.foundItem ? m.foundItem : m.lostItem;
    if (target) navigate(`/item/${target.kind}/${target.id}`);
  };

  // Only the reporter of the lost side may claim (admins approve in /admin)
  const canClaim = (m) =>
    Boolean(user && user.role !== 'admin' && m.lostItem?.userId === user.id && m.foundItem && !m.claimed);

  const loadingNow = matchLoading;

  return (
    <div className="page">
      <PageHeader
        eyebrow="AI Matching"
        title="Smart Matches"
        subtitle={
          user && user.role !== 'admin'
            ? `${visibleMatches.length} possible pairing${visibleMatches.length === 1 ? '' : 's'} for your reports — new candidates appear within seconds of reporting.`
            : `${visibleMatches.length} possible pairings found between lost and found reports — sorted by match strength.`
        }
      />

      <div className="match-stats">
        <div className="match-stats__lead">
          <Icon name="flame" size={22} />
          <div>
            <strong>{visibleMatches.length}</strong>
            <span>active pairings</span>
          </div>
        </div>
        <div className="match-stats__legend">
          <span><i className="legend-dot legend-dot--strong" /> Strong (85%+)</span>
          <span><i className="legend-dot legend-dot--possible" /> Possible (70–84%)</span>
          <span><i className="legend-dot legend-dot--low" /> Low (58–69%)</span>
        </div>
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Filter by match strength">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`filter-tab ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            <Icon name={f.icon} size={15} />
            {f.label}
            <span className="filter-tab__count">{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      {loadingNow ? (
        <div className="page--center">
          <LoadingSpinner label="Running the matching engine…" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="flame"
          title={filter === 'All' ? 'No matches found yet' : `No ${filter.toLowerCase()} matches`}
          message="Matches appear when a lost and a found report share category, colour, location or timing."
          actionLabel="Report an Item"
          onAction={() => navigate('/report-lost')}
        />
      ) : (
        <div className="match-list">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onView={handleView}
              onClaim={canClaim(m) ? () => setClaimItem(m.foundItem) : undefined}
              claimed={m.claimed || viewed[m.id]}
            />
          ))}
        </div>
      )}

      {/* secure claim wizard on the matched found item */}
      <ClaimFormModal
        open={Boolean(claimItem)}
        onClose={() => {
          setClaimItem(null);
        }}
        item={claimItem}
      />
    </div>
  );
}
