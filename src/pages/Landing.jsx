import { Link } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import ItemCard from '../components/ItemCard.jsx';
import useItems from '../hooks/useItems.js';
import useCountUp from '../hooks/useCountUp.js';
import { useEffect, useMemo, useState } from 'react';

const HERO_LOST = { title: 'Black Noise Smartwatch', loc: 'College Library', time: '02:30 PM' };
const HERO_FOUND = { title: 'Black Smartwatch', loc: 'College Library', time: '05:15 PM' };

const HERO_LINES = [
  'Lost at the library?',
  'Forgot your wallet in the canteen?',
  'Smartwatch slipped off in class?'
];

function HeroMockup() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % HERO_LINES.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-mock" aria-hidden="true">
      <div className="hero-mock__glow" />
      <div className="hero-mock__typing">
        <Icon name="search" size={16} />
        <span>{HERO_LINES[line]}</span>
        <em className="caret" />
      </div>

      <div className="hero-mock__card hero-mock__card--lost">
        <div className="hero-mock__thumb">⌚</div>
        <div>
          <span className="badge badge--danger">Lost</span>
          <strong>{HERO_LOST.title}</strong>
          <p>
            <Icon name="pin" size={12} /> {HERO_LOST.loc} · {HERO_LOST.time}
          </p>
        </div>
      </div>

      <div className="hero-mock__link">
        <span className="hero-mock__line" />
        <span className="hero-mock__chip">
          🔥 <strong>91%</strong> possible match
        </span>
      </div>

      <div className="hero-mock__card hero-mock__card--found">
        <div className="hero-mock__thumb">⌚</div>
        <div>
          <span className="badge badge--success">Found</span>
          <strong>{HERO_FOUND.title}</strong>
          <p>
            <Icon name="pin" size={12} /> {HERO_FOUND.loc} · {HERO_FOUND.time}
          </p>
        </div>
      </div>

      <div className="hero-mock__meta">
        <span>Reported 3 hours apart</span>
        <span className="hero-mock__pulse">● smart match engine</span>
      </div>
    </div>
  );
}

function Stat({ value, suffix = '', label, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const n = useCountUp(value, { duration: 1600, start: show });
  return (
    <div className="hero-stat">
      <strong>
        {n.toLocaleString('en-IN')}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

export default function Landing() {
  const { lostItems, foundItems, loading } = useItems();

  const featuredLost = useMemo(() => lostItems.slice(0, 3), [lostItems]);
  const featuredFound = useMemo(() => foundItems.slice(0, 3), [foundItems]);

  const steps = [
    { n: '1', icon: 'alert', title: 'Report', text: 'File a detailed lost or found report in under two minutes — add a photo, location and description.' },
    { n: '2', icon: 'zap', title: 'Match', text: 'FindIt’s matching engine compares colour, category, brand, location and timing to suggest possible matches.' },
    { n: '3', icon: 'claim', title: 'Claim', text: 'Answer a verification question or submit proof to confirm the item genuinely belongs to you.' },
    { n: '4', icon: 'checkCircle', title: 'Recover', text: 'Meet at the campus collection point, show your ID, and take your belongings home.' }
  ];

  const features = [
    { icon: 'flame', title: 'Smart Matching', text: 'AI-style scoring (91% and counting) that pairs lost items with found reports — live from MySQL.' },
    { icon: 'pin', title: 'Location-Based Search', text: 'Filter reports by canteen, library, labs, parking and every campus corner.' },
    { icon: 'bell', title: 'Instant Notifications', text: 'Get pinged the moment a possible match for your report is discovered.' },
    { icon: 'shield', title: 'Secure Claims', text: 'Verification questions and proof uploads keep items with their true owners.' },
    { icon: 'map', title: 'Lost Item Heatmap', text: 'See where things get lost most with a live campus heatmap for admins.' },
    { icon: 'chart', title: 'Admin Analytics', text: 'Category trends, monthly report volumes and recovery rates at a glance.' }
  ];

  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__badge">🎓 Campus Lost &amp; Found · Full-Stack MERN + MySQL</span>
            <h1 className="hero__title">
              Find<span className="text-gradient">It</span>
            </h1>
            <p className="hero__tag">Intelligent Lost &amp; Found Management System</p>
            <p className="hero__text">
              Lost something? FindIt helps you reconnect with your belongings through intelligent
              matching — report an item and let the smart engine pair it with what others found.
            </p>
            <div className="hero__cta">
              <Link to="/report-lost" className="btn btn--primary btn--lg">
                <Icon name="alert" size={18} /> Report Lost Item
              </Link>
              <Link to="/report-found" className="btn btn--outline-light btn--lg">
                <Icon name="flag" size={18} /> Report Found Item
              </Link>
              <Link to="/search" className="btn btn--ghost-light btn--lg">
                <Icon name="search" size={18} /> Find an Item
              </Link>
            </div>
            <div className="hero__stats">
              <Stat value={1248} label="Items Reported" delay={100} />
              <Stat value={856} label="Items Found" delay={250} />
              <Stat value={642} label="Items Recovered" delay={400} />
              <Stat value={91} suffix="%" label="Match Accuracy" delay={550} />
            </div>
          </div>
          <div className="hero__visual">
            <HeroMockup />
          </div>
        </div>
        <div className="hero__wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0 40c240 55 480 55 720 15s480-40 720-15v40H0z" />
          </svg>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">Live campus feed</span>
            <h2>Recently reported on campus</h2>
            <p>Real-time activity from MySQL — latest lost &amp; found reports.</p>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="grid grid--3">
                {featuredLost.map((i) => (
                  <ItemCard key={i.id} item={i} />
                ))}
              </div>
              <div className="grid grid--3" style={{ marginTop: 16 }}>
                {featuredFound.map((i) => (
                  <ItemCard key={i.id} item={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">How it works</span>
            <h2>From lost to found in four steps</h2>
          </div>
          <div className="steps">
            {steps.map((s) => (
              <article className="step-card" key={s.n}>
                <span className="step-card__num">{s.n}</span>
                <span className="step-card__icon">
                  <Icon name={s.icon} size={20} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">Features</span>
            <h2>Everything you need to reunite with your stuff</h2>
          </div>
          <div className="grid grid--3">
            {features.map((f) => (
              <article className="feature-card" key={f.title}>
                <span className="feature-card__icon">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-panel">
            <div className="cta-panel__icon">🔍</div>
            <h2>Still looking for something?</h2>
            <p>Join 1,200+ students who trust FindIt to bring their belongings back.</p>
            <div className="cta-panel__actions">
              <Link to="/register" className="btn btn--primary btn--lg">
                Create Free Account
              </Link>
              <Link to="/search" className="btn btn--outline btn--lg">
                Browse Items First
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
