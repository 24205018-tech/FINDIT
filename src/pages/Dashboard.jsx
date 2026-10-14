import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Button from '../components/Button.jsx';
import StatCard from '../components/StatCard.jsx';
import Card from '../components/Card.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ItemCard from '../components/ItemCard.jsx';
import MatchCard from '../components/MatchCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';
import useItems from '../hooks/useItems.js';
import useMatches from '../hooks/useMatches.js';
import useClaims from '../hooks/useClaims.js';
import useCountUp from '../hooks/useCountUp.js';
import { timeAgo } from '../utils/helpers.js';
import { itemImage, fallbackSrc } from '../utils/mockImage.js';

const WELCOME = [
  'Welcome back', 'Good to see you', 'Hey there', 'Welcome back, champ'
];

export default function Dashboard() {
  const { user } = useAuth();
  const { lostItems, foundItems, loading } = useItems();
  const { matches } = useMatches();
  const { claims } = useClaims(user?.id);

  const greeting = useMemo(() => WELCOME[new Date().getHours() % WELCOME.length], []);

  // matches that involve the signed-in user's own reports
  const myMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.lostItem?.userId === user?.id || m.foundItem?.userId === user?.id
      ),
    [matches, user?.id]
  );

  // stats scoped to the current user
  const stats = useMemo(() => {
    const lost = lostItems.filter((i) => i.userId === user?.id);
    const found = foundItems.filter((i) => i.userId === user?.id);
    const activeClaims = claims.filter((c) => ['Pending', 'Under Review'].includes(c.status));
    const recovered = [...lost, ...found].filter((i) => i.status === 'Recovered');
    return {
      lost: lost.length,
      found: found.length,
      matches: myMatches.length,
      claims: activeClaims.length,
      recovered: recovered.length
    };
  }, [lostItems, foundItems, myMatches, claims, user?.id]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const animatedLost = useCountUp(stats.lost, { duration: 900, start: !loading });
  const animatedFound = useCountUp(stats.found, { duration: 900, start: !loading });
  const animatedMatches = useCountUp(stats.matches, { duration: 900, start: !loading });
  const animatedClaims = useCountUp(stats.claims, { duration: 900, start: !loading });
  const animatedRecovered = useCountUp(stats.recovered, { duration: 900, start: !loading });

  const hotMatch = useMemo(() => {
    // “Possible Match Alert” semantics: an OPEN found item that may match one
    // of my lost reports (resolved/claimed pairs are skipped). Falls back to
    // any pairing when none exists.
    const open = myMatches.filter((m) => !m.claimed);
    const bestOf = (pool) =>
      pool.length ? pool.reduce((best, m) => (m.score > best.score ? m : best), pool[0]) : null;
    const lostSide = open.filter((m) => m.lostItem?.userId === user?.id);
    return bestOf(lostSide) || bestOf(open) || bestOf(myMatches);
  }, [myMatches, user?.id]);

  const myRecent = useMemo(() => {
    const mine = [...lostItems, ...foundItems].filter((i) => i.userId === user?.id);
    return mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [lostItems, foundItems, user?.id]);

  const hour = new Date().getHours();
  const timeNote = hour < 12 ? '🌤 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  return (
    <div className="page">
      {/* welcome hero */}
      <section className="dash-hero">
        <div>
          <p className="dash-hero__note">{timeNote} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="dash-hero__title">
            {greeting}, {firstName}! <span className="dash-hero__wave">👋</span>
          </h1>
          <p className="dash-hero__sub">
            {stats.lost > 0 || stats.found > 0
              ? 'Here is what’s happening with your reports today.'
              : 'You have no reports yet — start by reporting an item you lost or found.'}
          </p>
          <div className="dash-hero__actions">
            <Link to="/report-lost" className="btn btn--primary">
              <Icon name="alert" size={16} /> Report Lost
            </Link>
            <Link to="/report-found" className="btn btn--white">
              <Icon name="flag" size={16} /> Report Found
            </Link>
          </div>
        </div>
        <div className="dash-hero__art" aria-hidden="true">
          <span className="dash-hero__badge">🔍</span>
        </div>
      </section>

      {/* stats */}
      <section className="stats-grid">
        <StatCard icon="alert" label="Lost Reports" value={loading ? '…' : animatedLost} countUp={false} color="#ef4444" delta={stats.lost > 0 ? '+2' : null} />
        <StatCard icon="flag" label="Found Reports" value={loading ? '…' : animatedFound} countUp={false} color="#10b981" delta={stats.found > 0 ? '+1' : null} />
        <StatCard icon="flame" label="Possible Matches" value={loading ? '…' : animatedMatches} countUp={false} color="#f59e0b" />
        <StatCard icon="claim" label="Active Claims" value={loading ? '…' : animatedClaims} countUp={false} color="#0ea5e9" />
        <StatCard icon="checkCircle" label="Recovered Items" value={loading ? '…' : animatedRecovered} countUp={false} color="#8b5cf6" />
      </section>

      <div className="dash-grid">
        <div className="dash-main-col">
          {/* match alert */}
          {hotMatch ? (
            <section className="match-alert">
              <div className="match-alert__flame">🔥</div>
              <div className="match-alert__content">
                <span className="match-alert__tag">Possible Match Alert</span>
                <h2>{hotMatch.score}% Possible Match</h2>
                <p>
                  Lost item: <strong>{hotMatch.lostItem?.title || '—'}</strong>
                  <span className="match-alert__sep">→</span>
                  Possible found item: <strong>{hotMatch.foundItem?.title || '—'}</strong>
                </p>
                <div className="match-alert__meta">
                  <span><Icon name="pin" size={13} /> {hotMatch.lostItem?.location}</span>
                  <span><Icon name="clock" size={13} /> Reported {hotMatch.timeDiff || 'hours apart'}</span>
                </div>
                <div className="match-alert__bar">
                  <span style={{ width: `${hotMatch.score}%` }} />
                </div>
              </div>
              <Link to="/matches" className="btn btn--primary">
                View Match <Icon name="chevronRight" size={15} />
              </Link>
            </section>
          ) : (
            <Card title="Match centre" icon="flame" className="dash-card-empty">
              <p>No matches yet — report an item to start the hunt.</p>
            </Card>
          )}

          {/* recent reports */}
          <Card
            title="Recent Reports"
            icon="box"
            subtitle="Your latest lost & found activity"
            actions={<Link to="/my-reports" className="btn btn--ghost btn--sm">View all</Link>}
          >
            {loading ? (
              <LoadingSpinner label="Loading your reports…" />
            ) : myRecent.length === 0 ? (
              <div className="dash-quick">
                <p>Nothing reported yet. Quick links:</p>
                <div>
                  <Link to="/report-lost" className="btn btn--outline btn--sm">+ Lost item</Link>
                  <Link to="/report-found" className="btn btn--outline btn--sm">+ Found item</Link>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table table--recent">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRecent.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <Link className="mini-item" to={`/item/${i.kind}/${i.id}`}>
                            <img src={i.imagePreview || itemImage(i.image)} data-seed={i.title} alt="" onError={fallbackSrc} />
                            <span>
                              <strong>{i.title}</strong>
                              <em className={i.kind === 'lost' ? 'text-lost' : 'text-found'}>
                                {i.kind === 'lost' ? 'Lost' : 'Found'} · {timeAgo(i.createdAt)}
                              </em>
                            </span>
                          </Link>
                        </td>
                        <td>{i.category}</td>
                        <td>{i.location}</td>
                        <td>{i.date}</td>
                        <td><StatusBadge status={i.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <aside className="dash-side-col">
          {/* match of the day */}
          <Card title="Top Match" icon="zap" subtitle="Highest confidence pairing">
            {loading ? (
              <LoadingSpinner label="Scanning…" />
            ) : hotMatch ? (
              <MatchCard match={hotMatch} />
            ) : (
              <div className="dash-quick">
                <p>No matches yet.</p>
              </div>
            )}
          </Card>

          <Card title="Quick Actions" icon="plus">
            <nav className="quick-nav">
              <Link to="/search"><Icon name="search" size={16} /> Search items</Link>
              <Link to="/matches"><Icon name="flame" size={16} /> Smart matches</Link>
              <Link to="/claims"><Icon name="claim" size={16} /> My claims</Link>
              <Link to="/notifications"><Icon name="bell" size={16} /> Notifications</Link>
            </nav>
          </Card>
        </aside>
      </div>

      {/* campus recent items */}
      <Card
        title="Latest Campus Reports"
        icon="grid"
        subtitle="What others reported recently on FindIt"
        actions={<Link to="/search" className="btn btn--ghost btn--sm">Search all</Link>}
      >
        <div className="grid grid--3">
          {[...lostItems, ...foundItems]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 6)
            .map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
        </div>
      </Card>
    </div>
  );
}
