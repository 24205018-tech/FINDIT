import { forwardRef, useId } from 'react';
import Icon from './Icons.jsx';

/**
 * Textual input with label, error, optional icon prefix and optional
 * password visibility toggle (`toggle={{ show, setShow }}`).
 * Forwarded refs allow parents to focus/clear it programmatically.
 */
const Input = forwardRef(function Input(
  {
    label,
    name,
    error,
    icon,
    hint,
    required,
    toggle,
    className = '',
    wrapperClassName = '',
    type = 'text',
    ...rest
  },
  ref
) {
  const autoId = useId();
  const id = rest.id || autoId;
  const inputType = toggle ? (toggle.show ? 'text' : 'password') : type;
  const withToggle = Boolean(toggle);

  return (
    <div className={`field ${wrapperClassName}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__req"> *</span>}
        </label>
      )}
      <div className={`input-wrap ${error ? 'input-wrap--error' : ''}`.trim()}>
        {icon && <span className="input-wrap__icon">{icon}</span>}
        <input
          ref={ref}
          id={id}
          name={name}
          type={inputType}
          className={[
            'input',
            icon ? 'input--with-icon' : '',
            withToggle ? 'input--with-toggle' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        {withToggle && (
          <button
            type="button"
            className="input-wrap__toggle"
            aria-label={toggle.show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            onClick={() => toggle.setShow(!toggle.show)}
          >
            <Icon name={toggle.show ? 'eyeOff' : 'eye'} size={17} />
          </button>
        )}
      </div>
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
