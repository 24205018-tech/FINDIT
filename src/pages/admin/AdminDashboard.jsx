import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icons.jsx';
import Card from '../../components/Card.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import useItems from '../../hooks/useItems.js';
import useClaims from '../../hooks/useClaims.js';
import { Donut, HBarList } from '../../components/Charts.jsx';
import { analyticsAPI } from '../../services/api.js';
import { timeAgo } from '../../utils/helpers.js';
import { itemImage, fallbackSrc } from '../../utils/mockImage.js';

const metricDefs = [
  { label: 'Total Users', key: 'totalUsers', icon: 'users', color: '#4f46e5', to: '/admin/users' },
  { label: 'Lost Items', key: 'lostItems', icon: 'alert', color: '#ef4444', to: '/admin/lost-items' },
  { label: 'Found Items', key: 'foundItems', icon: 'flag', color: '#10b981', to: '/admin/found-items' },
  { label: 'Pending Claims', key: 'pendingClaims', icon: 'claim', color: '#f59e0b', to: '/admin/claims' },
  { label: 'Recovered Items', key: 'recoveredItems', icon: 'checkCircle', color: '#0ea5e9', to: '/admin/heatmap' }
];

export default function AdminDashboard() {
  const { lostItems, foundItems, loading: itemsLoading } = useItems();
  const { claims, loading: claimsLoading } = useClaims(null);
  const [overview, setOverview] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    analyticsAPI.overview().then(res => {
      if (res.success) setOverview(res.data);
    }).catch(()=>{});
    analyticsAPI.get().then(res => {
      if (res.success && res.data.locations) setLocations(res.data.locations.slice(0,4));
    }).catch(()=>{});
  }, []);

  const pendingClaims = useMemo(
    () => claims.filter((c) => c.status === 'Pending' || c.status === 'Under Review'),
    [claims]
  );

  const recoveryRate = useMemo(() => {
    const all = [...lostItems, ...foundItems];
    const recovered = all.filter((i) => i.status === 'Recovered').length;
    return all.length ? Math.round((recovered / all.length) * 100) : 0;
  }, [lostItems, foundItems]);

  const latestItems = useMemo(
    () =>
      [...lostItems, ...foundItems]
        .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
        .slice(0, 6),
    [lostItems, foundItems]
  );

  const donutData = useMemo(
    () => [
      { label: 'Lost', value: lostItems.length },
      { label: 'Found', value: foundItems.length },
      { label: 'Recovered', value: Math.round(((lostItems.length + foundItems.length) * recoveryRate) / 100) }
    ],
    [lostItems, foundItems, recoveryRate]
  );

  const loading = itemsLoading || claimsLoading;

  const metricVal = (m) => {
    if (overview) {
      if (m.key === 'totalUsers') return overview.users;
      if (m.key === 'lostItems') return overview.lost;
      if (m.key === 'foundItems') return overview.found;
      if (m.key === 'pendingClaims') return overview.pendingClaims;
      if (m.key === 'recoveredItems') return overview.recovered;
    }
    if (m.key === 'lostItems') return lostItems.length;
    if (m.key === 'foundItems') return foundItems.length;
    if (m.key === 'pendingClaims') return pendingClaims.length;
    if (m.key === 'recoveredItems') return [...lostItems, ...foundItems].filter(i => i.status === 'Recovered').length;
    return '—';
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title="Overview"
        subtitle="Campus-wide lost & found health — live from MongoDB."
      />

      <section className="stats-grid stats-grid--5">
        {metricDefs.map((m) => (
          <Link to={m.to} className="stat-card stat-card--link" key={m.key} style={{ '--stat-color': m.color }}>
            <span className="stat-card__icon"><Icon name={m.icon} size={20} /></span>
            <div className="stat-card__content">
              <p className="stat-card__label">{m.label}</p>
              <p className="stat-card__value">{loading && (m.key === 'lostItems' || m.key === 'foundItems') ? '…' : metricVal(m)}</p>
              <p className="stat-card__delta is-up">live</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="dash-grid">
        <div className="dash-main-col">
          <Card
            title="Latest Reports"
            icon="box"
            subtitle="Newest activity across campus"
            actions={<Link to="/search" className="btn btn--ghost btn--sm">Open public search</Link>}
          >
            {loading ? (
              <LoadingSpinner label="Loading reports…" />
            ) : (
              <div className="admin-feed">
                {latestItems.map((i) => (
                  <Link to={`/item/${i.kind}/${i.id}`} className="admin-feed__row" key={i.id}>
                    <img src={i.imagePreview || i.image_preview || itemImage(i.image)} data-seed={i.title} alt="" onError={fallbackSrc} />
                    <span className="admin-feed__main">
                      <strong>{i.title}</strong>
                      <em><Icon name="pin" size={11} /> {i.location}</em>
                    </span>
                    <span className={`badge ${i.kind === 'lost' ? 'badge--danger' : 'badge--success'}`}>
                      {i.kind === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className="admin-feed__time">{timeAgo(i.createdAt || i.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="dash-side-col">
          <Card title="Reports Breakdown" icon="chart">
            <div className="admin-donut">
              <Donut data={donutData} centerLabel="reports" />
              <div className="admin-donut__legend">
                <span><i style={{ background: '#4f46e5' }} /> Lost · {lostItems.length}</span>
                <span><i style={{ background: '#0ea5e9' }} /> Found · {foundItems.length}</span>
                <span><i style={{ background: '#22c55e' }} /> Recovered · {donutData[2].value}</span>
              </div>
            </div>
          </Card>

          <Card title="Top Loss Locations" icon="map">
            <HBarList data={locations.length ? locations : [{ label: 'Canteen', value: 37 }, { label: 'Library', value: 24 }]} />
            <Link to="/admin/heatmap" className="btn btn--ghost btn--sm btn--block">Open heatmap</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
