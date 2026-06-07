import { useEffect, type ReactElement } from 'react';

type ToastVariant = 'success' | 'neutral' | 'error';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Defaults to 4000. */
  duration?: number;
}

// Per-variant colour classes. neutral uses circa tokens; success/error use
// raw green/red with dark: overrides — one-off in a single component.
const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  neutral: 'bg-circa-surface-raised border-circa-border text-circa-text-secondary',
  error:   'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
};

function SuccessIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <circle cx="10" cy="10" r="9" />
      <polyline points="6 10 9 13 14 7" />
    </svg>
  );
}

function NeutralIcon() {
  // Door/exit shape: person leaving through a door
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <path d="M13 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9" />
      <polyline points="11 7 16 10 11 13" />
      <line x1="16" y1="10" x2="7" y2="10" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <circle cx="10" cy="10" r="9" />
      <line x1="7" y1="7" x2="13" y2="13" />
      <line x1="13" y1="7" x2="7" y2="13" />
    </svg>
  );
}

const icons: Record<ToastVariant, () => ReactElement> = {
  success: SuccessIcon,
  neutral: NeutralIcon,
  error:   ErrorIcon,
};

export default function Toast({
  message,
  onDismiss,
  variant = 'success',
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [onDismiss, duration]);

  const Icon = icons[variant];

  return (
    <div
      // error toasts use role="alert" so screen readers announce them immediately
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-60
        w-[90%] max-w-sm
        flex items-center gap-3
        px-4 py-3 rounded-lg shadow-lg
        border
        text-sm font-medium
        animate-slide-up
        ${variantStyles[variant]}
      `}
    >
      <Icon />

      <span>{message}</span>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>
    </div>
  );
}
