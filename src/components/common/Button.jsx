import './Button.css';

function Button({
  onClick,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  children,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || isLoading;
  const resolvedVariant = variant === 'danger' ? 'danger' : 'primary';
  const buttonClassName = [
    'button',
    `button--${resolvedVariant}`,
    isDisabled ? 'button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={buttonClassName}
      {...rest}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

export default Button;