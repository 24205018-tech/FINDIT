import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icons.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import useItems from '../../hooks/useItems.js';
import { useToast } from '../../hooks/useToast.jsx';
import { categoryOptions, getCategoryColor, timeAgo } from '../../utils/helpers.js';
import { itemImage, fallbackSrc } from '../../utils/mockImage.js';
import { usersAPI } from '../../services/api.js';

export default function AdminItemsList() {
  const { kind } = useParams();
  const isLost = kind === 'lost-items';
  const { lostItems, foundItems, loading, deleteItem, updateItem } = useItems();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    usersAPI.list({ limit: 200 }).then(res => {
      if (res.success) {
        const map = {};
        res.data.forEach(u => { map[u.id] = u.name; });
        setUsersMap(map);
      }
    }).catch(()=>{});
  }, []);

  const items = useMemo(() => {
    const pool = isLost ? lostItems : foundItems;
    const q = query.trim().toLowerCase();
    return pool
      .filter((i) => {
        if (status !== 'All' && i.status !== status) return false;
        if (category && i.category !== category) return false;
        if (!q) return true;
        return `${i.title} ${i.description} ${i.location} ${i.id}`.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
  }, [isLost, lostItems, foundItems, query, status, category]);

  const statusOptions = useMemo(() => {
    const pool = isLost ? lostItems : foundItems;
    return ['All', ...new Set(pool.map((i) => i.status))];
  }, [isLost, lostItems, foundItems]);

  const doDelete = () => {
    if (!toDelete) return;
    setDeleting(true);
    deleteItem(toDelete.id)
      .then(() => {
        toast.show({ kind: 'success', title: 'Item removed', message: `${toDelete.title} was deleted.` });
        setToDelete(null);
      })
      .catch((err) => toast.show({ kind: 'error', title: 'Delete failed', message: err.message }))
      .finally(() => setDeleting(false));
  };

  const cycleStatus = (item) => {
    const order = isLost
      ? ['Active', 'Claimed', 'Recovered', 'Active']
      : ['Reported', 'Claimed', 'Recovered', 'Reported'];
    const next = order[order.indexOf(item.status) + 1] || order[0];
    updateItem(item.id, { status: next }).then(() => {
      toast.show({ kind: 'success', title: 'Status updated', message: `${item.title} → ${next}` });
    });
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title={isLost ? 'Lost Items Registry' : 'Found Items Registry'}
        subtitle={`${isLost ? lostItems.length : foundItems.length} reports · live from MySQL.`}
      />

      <div className="search-toolbar">
        <div className="table-search">
          <Icon name="search" size={16} />
          <input
            placeholder={`Search ${isLost ? 'lost' : 'found'} reports…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-toolbar__right">
          <select className="select select--sm-inline" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categoryOptions().map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="select select--sm-inline" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="pad-lg"><span className="spinner" aria-hidden="true" /></div>
          ) : items.length === 0 ? (
            <div className="pad-lg">
              <EmptyState icon="box" title="No reports match" message="Try clearing filters." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="ta-r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link className="mini-item" to={`/item/${i.kind}/${i.id}`}>
                          <img src={i.imagePreview || i.image_preview || itemImage(i.image)} data-seed={i.title} alt="" onError={fallbackSrc} />
                          <span>
                            <strong>{i.title}</strong>
                            <em style={{ color: getCategoryColor(i.category) }}>{i.id}</em>
                          </span>
                        </Link>
                      </td>
                      <td>{i.category}</td>
                      <td>{usersMap[i.userId] || i.userName || i.user_name || '—'}</td>
                      <td>{i.location}</td>
                      <td>{i.date}<em className="block-muted">{timeAgo(i.createdAt || i.created_at)}</em></td>
                      <td><StatusBadge status={i.status} /></td>
                      <td>
                        <div className="row-actions">
                          <Link to={`/item/${i.kind}/${i.id}`} className="icon-btn" title="View">
                            <Icon name="eye" size={16} />
                          </Link>
                          <button type="button" className="icon-btn" title="Advance status" onClick={() => cycleStatus(i)}>
                            <Icon name="refresh" size={16} />
                          </button>
                          <button type="button" className="icon-btn icon-btn--danger" title="Remove" onClick={() => setToDelete(i)}>
                            <Icon name="trash" size={16} />
                          </button>
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

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={doDelete}
        busy={deleting}
        title="Remove from registry?"
        message={toDelete ? `“${toDelete.title}” will be permanently removed.` : ''}
        confirmLabel={deleting ? 'Removing…' : 'Remove Item'}
      />
    </div>
  );
}
