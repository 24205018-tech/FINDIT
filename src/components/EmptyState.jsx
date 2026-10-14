import Icon from './Icons.jsx';
import Button from './Button.jsx';

/** Friendly empty state used across lists/tables/search results. */
export default function EmptyState({ icon = 'box', title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={30} />
      </span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" icon="plus" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Slim inline empty message for tables */
export function InlineEmpty({ children = 'Nothing here yet.' }) {
  return <div className="inline-empty">{children}</div>;
}
