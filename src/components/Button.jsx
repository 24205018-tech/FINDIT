import Icon from './Icons.jsx';

/**
 * Button — variants: primary | secondary | outline | ghost | danger
 *          sizes: sm | md | lg
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  loading = false,
  block = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="btn__loading" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 17} />
      )}
      {children && <span>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={size === 'sm' ? 14 : 17} />}
    </button>
  );
}
