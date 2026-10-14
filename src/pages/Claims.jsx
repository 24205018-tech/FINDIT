import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ClaimFormModal from '../components/ClaimFormModal.jsx';
import useAuth from '../hooks/useAuth.js';
import useItems from '../hooks/useItems.js';
import useClaims from '../hooks/useClaims.js';
import { useToast } from '../hooks/useToast.jsx';
import { formatDateTime, timeAgo } from '../utils/helpers.js';
import { itemImage, fallbackSrc } from '../utils/mockImage.js';

const STATUS_EMOJI = { Pending: '🟡', 'Under Review': '🔵', Approved: '🟢', Rejected: '🔴' };

/** Claims page — table + expandable claim form modal + detail drawer */
export default function Claims() {
  const { user } = useAuth();
  const { lostItems, foundItems } = useItems();
  const { claims, loading, setFilter, filter } = useClaims(user?.id);
  const toast = useToast();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null); // claim being inspected
  const [claimItem, setClaimItem] = useState(null); // item chosen for a new claim

  const itemFor = useMemo(() => {
    const map = {};
    [...lostItems, ...foundItems].forEach((i) => {
      map[i.id] = i;
    });
    return map;
  }, [lostItems, foundItems]);

  const enriched = useMemo(() => {
    const list = claims
      .map((c) => ({ ...c, item: itemFor[c.itemId] || null }))
      .filter((c) => c.item);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [claims, itemFor]);

  const filtered = useMemo(
    () => (filter === 'All' ? enriched : enriched.filter((c) => c.status === filter)),
    [enriched, filter]
  );

  const statusCounts = useMemo(() => {
    const c = { All: enriched.length, Pending: 0, 'Under Review': 0, Approved: 0, Rejected: 0 };
    enriched.forEach((cl) => {
      if (c[cl.status] !== undefined) c[cl.status] += 1;
    });
    return c;
  }, [enriched]);

  const filters = [
    { id: 'All', label: 'All Claims', emoji: '📋' },
    { id: 'Pending', label: 'Pending', emoji: '🟡' },
    { id: 'Under Review', label: 'Under Review', emoji: '🔵' },
    { id: 'Approved', label: 'Approved', emoji: '🟢' },
    { id: 'Rejected', label: 'Rejected', emoji: '🔴' }
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Ownership"
        title="My Claims"
        subtitle="Track your ownership claims — statuses update as the campus team reviews them."
        actions={
          <Button
            variant="primary"
            icon="claim"
            onClick={() => {
              // Claim against a found item you believe is yours
              const candidates = foundItems.filter((f) => ['Reported', 'Active'].includes(f.status));
              if (candidates.length === 0) {
                toast.show({ kind: 'info', title: 'Nothing to claim', message: 'There are no unclaimed found items right now.' });
                return;
              }
              setClaimItem(candidates[0]);
            }}
          >
            New Claim
          </Button>
        }
      />

      {/* how claims work strip */}
      <div className="claim-strip">
        {[
          { icon: 'file', title: '1. Submit', text: 'Answer why the item is yours' },
          { icon: 'shield', title: '2. Verify', text: 'Hidden detail + proof match check' },
          { icon: 'checkCircle', title: '3. Collect', text: 'Approved → collect at front desk' }
        ].map((s) => (
          <div className="claim-strip__step" key={s.title}>
            <Icon name={s.icon} size={16} />
            <div>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Filter claims by status">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`filter-tab ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.emoji} {f.label}
            <span className="filter-tab__count">{statusCounts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="pad-lg"><LoadingSpinner label="Loading claims…" /></div>
          ) : filtered.length === 0 ? (
            <div className="pad-lg">
              <EmptyState
                icon="claim"
                title="No claims here"
                message={filter === 'All' ? 'You have not submitted any claims yet.' : `No ${filter.toLowerCase()} claims right now.`}
                actionLabel="Search found items"
                onAction={() => navigate('/search')}
              />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Claimed On</th>
                    <th>Claim Status</th>
                    <th>Last Updated</th>
                    <th className="ta-r">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <button type="button" className="mini-item mini-item--btn" onClick={() => setDetail(c)}>
                          {c.item && (
                            <img src={c.item.imagePreview || itemImage(c.item.image)} data-seed={c.item.title} alt="" onError={fallbackSrc} />
                          )}
                          <span>
                            <strong>{c.item.title}</strong>
                            <em>{c.item.category} · {c.item.location}</em>
                          </span>
                        </button>
                      </td>
                      <td>{formatDateTime(c.createdAt.slice(0, 10), '')}</td>
                      <td>
                        <StatusBadge status={c.status}>
                          {STATUS_EMOJI[c.status] || ''} {c.status}
                        </StatusBadge>
                      </td>
                      <td>{timeAgo(c.lastUpdated)}</td>
                      <td className="ta-r">
                        <div className="row-actions">
                          <button type="button" className="btn btn--outline btn--sm" onClick={() => setDetail(c)}>
                            View
                          </button>
                          {c.status === 'Pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="trash"
                              className="btn--danger-text"
                              onClick={() => {
                                toast.show({ kind: 'info', title: 'Withdrawn (demo)', message: 'Claim cancellation arrives with the backend milestone.' });
                              }}
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* claim detail modal */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Claim details"
        subtitle={detail?.id}
        icon="claim"
        size="md"
      >
        {detail && (
          <div className="claim-detail">
            <div className="claim-detail__item">
              {detail.item && (
                <img src={detail.item.imagePreview || itemImage(detail.item.image)} data-seed={detail.item.title} alt="" onError={fallbackSrc} />
              )}
              <div>
                <strong>{detail.item?.title}</strong>
                <p>{detail.item?.category} · {detail.item?.location}</p>
                <StatusBadge status={detail.status}>
                  {STATUS_EMOJI[detail.status]} {detail.status}
                </StatusBadge>
              </div>
            </div>
            <dl className="facts">
              <div><dt>Your statement</dt><dd>{detail.reason}</dd></div>
              <div><dt>Hidden detail</dt><dd>{detail.hiddenDetail}</dd></div>
              {detail.additionalInfo && <div><dt>Additional info</dt><dd>{detail.additionalInfo}</dd></div>}
              <div><dt>Proof</dt><dd>{detail.proofName ? `📎 ${detail.proofName}` : 'No file attached'}</dd></div>
              <div><dt>Submitted</dt><dd>{formatDateTime(detail.createdAt.slice(0, 10), '')}</dd></div>
              <div><dt>Last updated</dt><dd>{timeAgo(detail.lastUpdated)}</dd></div>
            </dl>
            <div className="claim-timeline">
              <span className="claim-timeline__dot is-done" />
              <div>
                <strong>Claim submitted</strong>
                <p>{timeAgo(detail.createdAt)}</p>
              </div>
              <span className={`claim-timeline__dot ${detail.status === 'Pending' ? 'is-now' : detail.status !== 'Rejected' ? 'is-done' : ''}`} />
              <div>
                <strong>{detail.status === 'Pending' ? 'Team review — in progress' : detail.status === 'Under Review' ? 'Verification in progress' : detail.status === 'Approved' ? 'Approved — collect your item' : 'Claim closed'}</strong>
                <p>{detail.status === 'Pending' ? 'Usually resolved within 48 hours.' : timeAgo(detail.lastUpdated)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ClaimFormModal
        open={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        item={claimItem}
      />
    </div>
  );
}
