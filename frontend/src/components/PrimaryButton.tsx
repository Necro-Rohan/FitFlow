interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  className?: string;
}

export function PrimaryButton({
  children, onClick, type = 'button',
  disabled, loading, variant = 'primary', className = ''
}: PrimaryButtonProps) {
  const base = 'px-4 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150';

  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    danger: 'bg-danger text-white hover:bg-danger-hover',
    secondary: 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
