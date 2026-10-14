import Icon from './Icons.jsx';

/** Content card — header(title/subtitle/actions) + body, optional padding */
export default function Card({ title, subtitle, icon, actions, className = '', children, bodyClassName = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <header className="card__header">
          <div className="card__title-wrap">
            {icon && (
              <span className="card__icon">
                <Icon name={icon} size={18} />
              </span>
            )}
            <div>
              {title && <h3 className="card__title">{title}</h3>}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={`card__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
