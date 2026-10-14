import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icons.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import useItems from '../../hooks/useItems.js';
import useClaims from '../../hooks/useClaims.js';
import { useToast } from '../../hooks/useToast.jsx';
import { formatDate, timeAgo } from '../../utils/helpers.js';
import { itemImage, fallbackSrc } from '../../utils/mockImage.js';
import { usersAPI } from '../../services/api.js';

export default function AdminClaims() {
  const { lostItems, foundItems, updateItem, load: loadItems } = useItems();
  const { claims, loading, changeStatus } = useClaims(null);
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    usersAPI.list({ limit: 200 }).then(res => {
      if (res.success) {
        const map = {};
        res.data.forEach(u => { map[u.id] = u; });
        setUsersMap(map);
      }
    }).catch(()=>{});
  }, []);

  const itemById = useMemo(() => {
    const map = {};
    [...lostItems, ...foundItems].forEach((i) => {
      map[String(i.id)] = i;
    });
    return map;
  }, [lostItems, foundItems]);

  const enriched = useMemo(() => {
    const list = claims
      .map((c) => ({
        ...c,
        item: itemById[String(c.itemId)] || c._raw || null,
        claimant: usersMap[c.userId] || { name: c._raw?.claimant_name || 'Unknown', email: c._raw?.claimant_email || '' },
      }))
      .filter((c) => c.item)
      .sort((a, b) => new Date(b.createdAt || b.lastUpdated) - new Date(a.createdAt || a.lastUpdated));
    return list;
  }, [claims, itemById, usersMap]);

  const filtered = useMemo(
    () => (filter === 'All' ? enriched : enriched.filter((c) => c.status === filter)),
    [enriched, filter]
  );

  const counts = useMemo(() => {
    const c = { All: enriched.length, Pending: 0, 'Under Review': 0, Approved: 0, Rejected: 0 };
    enriched.forEach((cl) => {
      if (c[cl.status] !== undefined) c[cl.status] += 1;
    });
    return c;
  }, [enriched]);

  const openClaim = enriched.find((c) => String(c.id) === String(openId));

  const decide = (claim, status) => {
    setBusyId(claim.id);
    const markItem = status === 'Approved' && claim.item?.status !== 'Recovered';
    changeStatus(claim.id, status)
      .then(async () => {
        if (markItem) {
          try {
            await updateItem(claim.itemId, { status: 'Recovered' });
          } catch {}
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('items:refresh'));
          window.dispatchEvent(new CustomEvent('notifications:refresh'));
        }
        if (loadItems) {
          await loadItems(true);
        }
        toast.show({
          kind: status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info',
          title: `Claim ${status}`,
          message: `Claim ${claim.id} on ${claim.item?.title || claim.itemTitle || 'item'} was set to ${status}.`
        });
        setOpenId(null);
      })
      .catch(err => toast.show({ kind: 'error', title: 'Failed', message: err.message }))
      .finally(() => setBusyId(null));
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title="Claims Queue"
        subtitle={`${counts.Pending} pending · ${counts['Under Review']} under review — live from MongoDB.`}
      />

      <div className="filter-tabs" role="tablist" aria-label="Filter claims">
        {[
          { id: 'All', label: 'All', emoji: '📋' },
          { id: 'Pending', label: 'Pending', emoji: '🟡' },
          { id: 'Under Review', label: 'Under Review', emoji: '🔵' },
          { id: 'Approved', label: 'Approved', emoji: '🟢' },
          { id: 'Rejected', label: 'Rejected', emoji: '🔴' }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-tab ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.emoji} {f.label}
            <span className="filter-tab__count">{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="pad-lg"><LoadingSpinner label="Loading claim queue…" /></div>
          ) : filtered.length === 0 ? (
            <div className="pad-lg"><EmptyState icon="claim" title="No claims" message="The queue is clear for this filter." /></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Item</th>
                    <th>Claimant</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="ta-r">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className={c.status === 'Pending' ? 'row-hot' : ''}>
                      <td className="mono">{c.id}</td>
                      <td>
                        <span className="mini-item mini-item--static">
                          {c.item && (
                            <img src={c.item.imagePreview || c.item.image_preview || itemImage(c.item.image)} data-seed={c.item.title || c.item.itemTitle} alt="" onError={fallbackSrc} />
                          )}
                          <span>
                            <strong>{c.item.title || c.item.itemTitle}</strong>
                            <em>{c.item.kind || c.item.itemKind} · {c.item.location || c.item.itemLocation}</em>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="user-cell user-cell--plain">
                          <strong>{c.claimant?.name || 'Unknown'}</strong>
                          <em>{c.claimant?.email}</em>
                        </span>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{formatDate((c.createdAt || '').slice(0,10))}<em className="block-muted">{timeAgo(c.createdAt)}</em></td>
                      <td className="ta-r">
                        <Button variant="outline" size="sm" icon="eye" onClick={() => setOpenId(c.id)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {openClaim && (
        <div className="review-drawer">
          <div className="review-drawer__head">
            <div>
              <h3>Review Claim {openClaim.id}</h3>
              <p>Submitted by {openClaim.claimant?.name} · {timeAgo(openClaim.createdAt)}</p>
            </div>
            <button type="button" className="icon-btn" aria-label="Close review" onClick={() => setOpenId(null)}>
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="review-drawer__body">
            <div className="review-item">
              {openClaim.item && (
                <img src={openClaim.item.imagePreview || openClaim.item.image_preview || itemImage(openClaim.item.image)} data-seed={openClaim.item.title} alt="" onError={fallbackSrc} />
              )}
              <div>
                <strong>{openClaim.item.title || openClaim.item.itemTitle}</strong>
                <p>{openClaim.item.description || ''}</p>
                <StatusBadge status={openClaim.item.status || 'Active'} />
              </div>
            </div>

            <div className="review-grid">
              <div className="review-block">
                <span className="review-block__label">Claimant statement</span>
                <p>{openClaim.reason}</p>
              </div>
              <div className="review-block">
                <span className="review-block__label">Hidden identifying detail</span>
                <p>{openClaim.hiddenDetail}</p>
              </div>
              {openClaim.additionalInfo && (
                <div className="review-block">
                  <span className="review-block__label">Additional info</span>
                  <p>{openClaim.additionalInfo}</p>
                </div>
              )}
              <div className="review-block">
                <span className="review-block__label">Proof</span>
                <p>{openClaim.proofName ? `📎 ${openClaim.proofName}` : 'No file attached'}</p>
              </div>
              <div className="review-block">
                <span className="review-block__label">Reporter's private detail (verification)</span>
                <p className="review-block__secret">
                  <Icon name="lock" size={12} />
                  {openClaim.item.details || openClaim.item.additional_info || 'Reporter added no private detail.'}
                </p>
              </div>
            </div>

            {openClaim.status === 'Approved' && (
              <div className="review-note review-note--ok">
                <Icon name="checkCircle" size={15} /> Approved — item marked recovered and the claimant was notified.
              </div>
            )}
            {openClaim.status === 'Rejected' && (
              <div className="review-note review-note--bad">
                <Icon name="alert" size={15} /> Rejected — hidden details did not match.
              </div>
            )}
          </div>

          {['Pending', 'Under Review'].includes(openClaim.status) && (
            <div className="review-drawer__foot">
              <Button variant="danger" icon="x" loading={busyId === openClaim.id} onClick={() => decide(openClaim, 'Rejected')}>
                Reject
              </Button>
              <Button variant="outline" loading={busyId === openClaim.id} onClick={() => decide(openClaim, 'Under Review')}>
                Keep Under Review
              </Button>
              <Button variant="success" icon="check" loading={busyId === openClaim.id} onClick={() => decide(openClaim, 'Approved')}>
                Approve & Mark Recovered
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
