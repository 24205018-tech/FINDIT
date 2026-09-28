import Icon from './Icons.jsx';

/** Page header used on inner pages: eyebrow, title, subtitle, actions */
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        {eyebrow && <span className="page-head__eyebrow">{eyebrow}</span>}
        <h1 className="page-head__title">{title}</h1>
        {subtitle && <p className="page-head__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}

/** Small labelled value pair used in info rows */
export function StatPill({ icon, label, value }) {
  return (
    <span className="stat-pill">
      {icon && <Icon name={icon} size={13} />} <span>{label}</span> <strong>{value}</strong>
    </span>
  );
}
