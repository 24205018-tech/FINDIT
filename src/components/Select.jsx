import { forwardRef, useId } from 'react';

const Select = forwardRef(function Select(
  { label, name, error, options = [], placeholder, required, className = '', wrapperClassName = '', ...rest },
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
      <div className={`select-wrap ${error ? 'select-wrap--error' : ''}`.trim()}>
        <select ref={ref} id={id} name={name} className="select" aria-invalid={Boolean(error)} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const isObj = opt && typeof opt === 'object';
            const value = isObj ? opt.value : opt;
            const labelText = isObj ? opt.label : opt;
            return (
              <option key={value} value={value} disabled={isObj && opt.disabled}>
                {labelText}
              </option>
            );
          })}
        </select>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
