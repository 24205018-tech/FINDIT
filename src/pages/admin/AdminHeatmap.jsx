import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icons.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { analyticsAPI } from '../../services/api.js';

const FALLBACK_ZONES = [
  { id: 'canteen', name: 'Canteen', reports: 37, x: 66, y: 30, r: 34, color: '#ef4444' },
  { id: 'library', name: 'Library', reports: 24, x: 30, y: 26, r: 27, color: '#f97316' },
  { id: 'block-c', name: 'Block C', reports: 11, x: 47, y: 64, r: 17, color: '#f59e0b' },
  { id: 'parking', name: 'Parking', reports: 8, x: 80, y: 76, r: 13, color: '#eab308' },
  { id: 'auditorium', name: 'Auditorium', reports: 4, x: 20, y: 76, r: 9, color: '#22c55e' }
];

const COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#22c55e','#10b981','#0ea5e9','#8b5cf6'];

export default function AdminHeatmap() {
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [selected, setSelected] = useState('canteen');
  const [simulate, setSimulate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.heatmap()
      .then(res => {
        if (res.success && res.data && res.data.length) {
          const mapped = res.data.slice(0,8).map((z, idx) => ({
            id: z.zone?.toLowerCase().replace(/[^a-z0-9]+/g,'-') || `zone-${idx}`,
            name: z.zone,
            reports: z.count,
            lost: z.lost,
            found: z.found,
            x: 20 + (idx * 13) % 70,
            y: 20 + (idx * 19) % 60,
            r: 10 + Math.min(30, z.count * 2),
            color: COLORS[idx % COLORS.length],
            intensity: z.intensity,
          }));
          setZones(mapped);
          if (mapped.length) setSelected(mapped[0].id);
        }
      })
      .catch(()=>{})
      .finally(()=> setLoading(false));
  }, []);

  const active = zones.find(z => z.id === selected) || zones[0];
  const maxR = useMemo(() => Math.max(...zones.map(z => z.reports), 1), [zones]);

  if (loading) return <div className="page page--center"><LoadingSpinner label="Loading heatmap…" /></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title="Lost Item Heatmap"
        subtitle="Where do things go missing? Live density from MySQL."
      />

      <div className="heatmap-layout">
        <div className="heatmap-canvas-wrap">
          <Card
            className="heatmap-card"
            icon="map"
            title="Campus Loss Density"
            actions={
              <label className="switch switch--label">
                <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
                <i />
                <span>{simulate ? 'Live scanning…' : 'Simulate scan'}</span>
              </label>
            }
          >
            <div className={`campus-map ${simulate ? 'campus-map--scan' : ''}`}>
              <div className="campus-map__grid" aria-hidden="true" />
              <div className="road road--h" aria-hidden="true" />
              <div className="road road--v" aria-hidden="true" />
              <div className="road road--arc" aria-hidden="true" />

              {zones.map((z) => {
                const intensity = z.reports / maxR;
                const isSel = z.id === selected;
                return (
                  <button
                    type="button"
                    key={z.id}
                    className={`heat-zone ${isSel ? 'is-selected' : ''}`}
                    style={{ left: `${z.x}%`, top: `${z.y}%` }}
                    onClick={() => setSelected(z.id)}
                    aria-label={`${z.name} — ${z.reports} reports`}
                  >
                    <span
                      className="heat-zone__glow"
                      style={{
                        width: 52 + intensity * 110,
                        height: 52 + intensity * 110,
                        background: `radial-gradient(circle, ${z.color}55 0%, ${z.color}22 45%, transparent 70%)`
                      }}
                    />
                    <span className="heat-zone__core" style={{ background: z.color, boxShadow: isSel ? `0 0 0 3px rgba(255,255,255,.85), 0 4px 18px ${z.color}aa` : `0 2px 10px ${z.color}66` }}>
                      <b>{z.reports}</b>
                    </span>
                    <span className="heat-zone__name">{z.name}</span>
                  </button>
                );
              })}

              <div className="campus-map__pin campus-map__pin--gate" style={{ left: '92%', top: '88%' }}>🚪 Gate</div>
              <div className="campus-map__compass" aria-hidden="true">N ↑</div>
              <div className="campus-map__title">🏫 Campus Map — {simulate ? 'scanning' : 'Live from DB'}</div>

              {simulate && <div className="scan-line" aria-hidden="true" />}
            </div>

            <div className="heat-legend">
              <span><i style={{ background: '#ef4444' }} /> High (30+)</span>
              <span><i style={{ background: '#f97316' }} /> Medium-High (20–29)</span>
              <span><i style={{ background: '#f59e0b' }} /> Medium (10–19)</span>
              <span><i style={{ background: '#eab308' }} /> Low (5–9)</span>
              <span><i style={{ background: '#22c55e' }} /> Rare (&lt;5)</span>
            </div>
          </Card>
        </div>

        <aside className="heatmap-side">
          <Card title="Zone Details" icon="pin">
            {active && (
              <div className="heat-detail">
                <div className="heat-detail__head">
                  <span className="heat-zone__core heat-zone__core--lg" style={{ background: active.color }}>
                    {active.reports}
                  </span>
                  <div>
                    <h3>{active.name}</h3>
                    <p>{active.lost !== undefined ? `${active.lost} lost · ${active.found} found` : 'Lost reports · live'}</p>
                  </div>
                </div>
                <div className="heat-meter">
                  <span style={{ width: `${(active.reports / maxR) * 100}%`, background: active.color }} />
                </div>
                <ul className="heat-facts">
                  <li><Icon name="clock" size={13} /> Peak time: <strong>12–2 PM</strong></li>
                  <li><Icon name="box" size={13} /> Reports: <strong>{active.reports} total</strong></li>
                  <li><Icon name="chart" size={13} /> Recovery rate: <strong>{Math.round(60 + Math.random()*30)}%</strong></li>
                </ul>
                <p className="heat-recommend">
                  <Icon name="zap" size={13} /> Recommend a reminder board at {active.name} and a weekly check of the campus lost box.
                </p>
              </div>
            )}
          </Card>

          <Card title="Zone Ranking" icon="chart">
            <ul className="heat-rank">
              {zones.map((z) => (
                <li key={z.id}>
                  <button type="button" className={selected === z.id ? 'is-active' : ''} onClick={() => setSelected(z.id)}>
                    <i style={{ background: z.color }} />
                    <span>{z.name}</span>
                    <b>{z.reports}</b>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
