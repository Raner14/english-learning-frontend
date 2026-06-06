function Input({ value, onChange, label, error, type = 'text', name }) {
  return (
    <label style={{ display: 'block', width: '100%' }}>
      <span
        style={{
          display: 'inline-block',
          marginBottom: '0.5rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#0f172a',
        }}
      >
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        style={{
          width: '100%',
          padding: '0.8rem 1rem',
          borderRadius: '10px',
          border: `1px solid ${error ? '#dc2626' : '#cbd5e1'}`,
          outline: 'none',
          fontSize: '0.95rem',
          color: '#0f172a',
          background: '#ffffff',
          boxSizing: 'border-box',
        }}
      />
      {error ? <p style={{ margin: '0.45rem 0 0', color: '#dc2626', fontSize: '0.85rem' }}>{error}</p> : null}
    </label>
  );
}

export default Input;