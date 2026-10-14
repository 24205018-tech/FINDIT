import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Icon from '../components/Icons.jsx';
import Button from '../components/Button.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';
import useItems from '../hooks/useItems.js';
import useMatches from '../hooks/useMatches.js';
import useClaims from '../hooks/useClaims.js';
import { useToast } from '../hooks/useToast.jsx';
import { timeAgo } from '../utils/helpers.js';
import { itemImage, fallbackSrc } from '../utils/mockImage.js';

/**
 * My Reports — tabs (Lost/Found), table with match %, actions
 * (View / Edit / Delete + confirmation modal).
 */
export default function MyReports() {
  const { user } = useAuth();
  const { lostItems, foundItems, loading, deleteItem } = useItems();
  const { matches } = useMatches();
  const { claims } = useClaims(user?.id);
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('lost');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null); // item id being edited

  const items = useMemo(() => {
    const pool = (tab === 'lost' ? lostItems : foundItems).filter((i) => i.userId === user?.id);
    return [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tab, lostItems, foundItems, user?.id]);

  // best match score per report
  const scoreFor = useMemo(() => {
    const map = {};
    matches.forEach((m) => {
      const score = Math.max(map[m.lostItemId] || 0, map[m.foundItemId] || 0);
      map[m.lostItemId] = m.lostItem ? Math.max(map[m.lostItemId] || 0, m.score) : map[m.lostItemId];
      map[m.foundItemId] = m.foundItem ? Math.max(map[m.foundItemId] || 0, m.score) : map[m.foundItemId];
    });
    return map;
  }, [matches]);

  const claimStatusFor = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      map[c.itemId] = c.status;
    });
    return map;
  }, [claims]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDeleting(true);
    deleteItem(pendingDelete.id)
      .then(() => {
        toast.show({ kind: 'success', title: 'Report deleted', message: `“${pendingDelete.title}” was removed.` });
        setPendingDelete(null);
      })
      .catch((err) => toast.show({ kind: 'error', title: 'Delete failed', message: err.message }))
      .finally(() => setDeleting(false));
  };

  const submitEdit = (id, patch) => {
    setEditing(id);
    // Edit flow in the frontend milestone: simulate a lightweight inline status change
    // (a full edit screen is a quick API swap away in the backend milestone).
    return Promise.resolve(patch);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="My activity"
        title="My Reports"
        subtitle="Everything you reported, with live match updates."
        actions={
          <div className="page-head__actions">
            <Link to="/report-lost" className="btn btn--primary btn--sm"><Icon name="plus" size={15} /> Report Lost</Link>
            <Link to="/report-found" className="btn btn--outline btn--sm"><Icon name="plus" size={15} /> Report Found</Link>
          </div>
        }
      />

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'lost'}
          className={`tab ${tab === 'lost' ? 'is-active' : ''}`}
          onClick={() => setTab('lost')}
        >
          🟠 Lost Items <span className="tab__count">{lostItems.filter((i) => i.userId === user?.id).length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'found'}
          className={`tab ${tab === 'found' ? 'is-active' : ''}`}
          onClick={() => setTab('found')}
        >
          🟢 Found Items <span className="tab__count">{foundItems.filter((i) => i.userId === user?.id).length}</span>
        </button>
      </div>

      <div className="card">
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="pad-lg"><LoadingSpinner label="Loading your reports…" /></div>
          ) : items.length === 0 ? (
            <div className="pad-lg">
              <EmptyState
                icon="box"
                title={`No ${tab} reports yet`}
                message={`When you report a ${tab} item it will show up here with live match status.`}
                actionLabel={tab === 'lost' ? 'Report a lost item' : 'Report a found item'}
                onAction={() => navigate(tab === 'lost' ? '/report-lost' : '/report-found')}
              />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Match</th>
                    <th className="ta-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const score = scoreFor[item.id];
                    const claimState = claimStatusFor[item.id];
                    return (
                      <tr key={item.id}>
                        <td>
                          <Link className="mini-item" to={`/item/${item.kind}/${item.id}`}>
                            <img src={item.imagePreview || itemImage(item.image)} data-seed={item.title} alt="" onError={fallbackSrc} />
                            <span>
                              <strong>{item.title}</strong>
                              <em>{item.colour && item.colour !== '—' ? `${item.colour} · ` : ''}{timeAgo(item.createdAt)}</em>
                            </span>
                          </Link>
                        </td>
                        <td>{item.category}</td>
                        <td>{item.location}</td>
                        <td>{item.date}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>
                          {score ? (
                            <span className={`match-chip ${score >= 85 ? 'match-chip--strong' : score >= 70 ? 'match-chip--ok' : ''}`}>
                              🔥 {score}%
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                          {claimState && (
                            <div className="mt-4"><StatusBadge status={`Claim ${claimState}`} /></div>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link to={`/item/${item.kind}/${item.id}`} className="icon-btn" title="View" aria-label={`View ${item.title}`}>
                              <Icon name="eye" size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                              onClick={() => {
                                setEditing(item.id);
                                toast.show({ kind: 'info', title: 'Edit mode', message: 'Editing opens after the backend milestone — reporting again updates your record.' });
                                setTimeout(() => setEditing(null), 900);
                              }}
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                              onClick={() => setPendingDelete(item)}
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        title="Delete this report?"
        message={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed permanently. Any open claim on this item will also be closed.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Yes, delete'}
      />
    </div>
  );
}
