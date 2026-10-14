/**
 * Zero-dependency SVG/CSS charts (admin analytics).
 * A library (e.g. recharts) can be dropped in later without changing the
 * data shape.
 */
import { useMemo } from 'react';

const PALETTE = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

/** Vertical bar chart — used for the monthly lost/found reports */
export function BarChart({ data = [], legend = [], height = 260 }) {
  const { max } = useMemo(() => {
    const all = data.flatMap((d) => Object.values(d).filter((v) => typeof v === 'number'));
    return { max: Math.max(8, ...all) };
  }, [data]);

  const seriesKeys = data[0] ? Object.keys(data[0]).filter((k) => typeof data[0][k] === 'number') : [];
  const numSeries = Math.max(1, seriesKeys.length);

  return (
    <div>
      {legend.length > 0 && (
        <div className="chart-legend">
          {legend.map((l) => (
            <span key={l.name} className="chart-legend__item">
              <span className="chart-legend__dot" style={{ background: l.color }} /> {l.name}
            </span>
          ))}
        </div>
      )}
      <div className="barchart" style={{ height }}>
        <div className="barchart__scale" aria-hidden="true">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0</span>
        </div>
        <div className="barchart__grid" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} />
          ))}
        </div>
        <div className="barchart__cols">
          {data.map((row, i) => (
            <div className="barchart__group" key={i}>
              <div className="barchart__bars">
                {seriesKeys.map((k, si) => {
                  const h = Math.max(2, (row[k] / max) * 100);
                  return (
                    <div key={k} className="barchart__col" title={`${row.month || row.label}: ${row[k]}`}>
                      <span
                        className="barchart__bar"
                        style={{ height: `${h}%`, background: PALETTE[si % PALETTE.length] }}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="barchart__label">{row.month ? row.month.slice(0, 3) : row.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="barchart__values" aria-hidden="true">
        {data.map((row, i) => (
          <span key={i}>{row.month ? row.month.slice(0, 3) : row.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar list — category / location rankings with counts */
export function HBarList({ data = [], unit = 'items' }) {
  const { max } = useMemo(() => ({ max: Math.max(...data.map((d) => d.value), 1) }), [data]);
  return (
    <ul className="hbar-list">
      {data.map((d, i) => (
        <li key={d.label} className="hbar">
          <span className="hbar__label">{d.label}</span>
          <span className="hbar__track">
            <span
              className="hbar__fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: PALETTE[i % PALETTE.length]
              }}
            />
          </span>
          <span className="hbar__value">
            {d.value} <em>{unit}</em>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Donut chart (SVG stroke-dasharray) — used for lost vs found share */
export function Donut({ data = [], size = 170, thickness = 22, centerLabel, centerValue }) {
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  const total = Math.max(
    1,
    data.reduce((s, d) => s + d.value, 0)
  );
  let acc = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(148,163,184,.15)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = `${frac * C} ${C - frac * C}`;
          const offset = -acc * C;
          acc += frac;
          return (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={R}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="donut__center">
        <strong>{centerValue ?? total}</strong>
        <span>{centerLabel || 'total'}</span>
      </div>
    </div>
  );
}
