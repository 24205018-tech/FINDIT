import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, name, error, hint, required, rows = 3, className = '', wrapperClassName = '', ...rest },
  ref
) {
  const autoId = useId();
  const id = rest.id || autoId;
  return (
    <div className={`field ${wrapperClassName}`.trim()}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__req"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        className={`textarea ${error ? 'textarea--error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;
