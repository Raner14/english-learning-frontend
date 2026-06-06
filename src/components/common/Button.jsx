function Button({ onClick, variant = 'primary', isLoading = false, disabled = false, children, ...rest }) {
  const isDisabled = disabled || isLoading;

  const baseStyle = {
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.1rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease',
    opacity: isDisabled ? 0.7 : 1,
  };

  const variantStyle =
    variant === 'danger'
      ? {
          background: '#dc2626',
          color: '#ffffff',
        }
      : {
          background: '#2563eb',
          color: '#ffffff',
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      style={{ ...baseStyle, ...variantStyle }}
      {...rest}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

export default Button;