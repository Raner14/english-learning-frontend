import './Input.css';

function Input({ value, onChange, label, error, type = 'text', name }) {
  const inputClassName = ['input-field', error ? 'input-field--error' : ''].filter(Boolean).join(' ');

  return (
    <label className="input-wrapper">
      <span className="input-label">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={inputClassName}
      />
      {error ? <p className="input-error">{error}</p> : null}
    </label>
  );
}

export default Input;