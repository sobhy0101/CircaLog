import { useRef } from 'react';

interface QualityPickerProps {
  value: number | null;
  onChange: (v: number) => void;
  label?: string;
}

const LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};

export default function QualityPicker({ value, onChange, label }: QualityPickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow key navigation for the radiogroup — moves focus and selection together.
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, n: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextN = n < 5 ? n + 1 : 1;
      onChange(nextN);
      buttonRefs.current[nextN - 1]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevN = n > 1 ? n - 1 : 5;
      onChange(prevN);
      buttonRefs.current[prevN - 1]?.focus();
    }
  }

  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-circa-text-primary mb-2">{label}</p>
      )}
      <div
        role="radiogroup"
        aria-label={label ?? 'Sleep quality rating'}
        className="flex items-center justify-center gap-3 w-full px-4"
      >
        {[1, 2, 3, 4, 5].map(n => {
          const selected = value === n;
          return (
            <button
              key={n}
              ref={el => { buttonRefs.current[n - 1] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={n === (value ?? 1) ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={e => handleKeyDown(e, n)}
              aria-label={`${n} — ${LABELS[n]}`}
              className={[
                'rounded-full border-2 flex items-center justify-center',
                'aspect-square flex-1 min-w-11 max-w-18 transition-colors',
                selected
                  ? 'bg-circa-accent border-circa-accent'
                  : 'bg-circa-surface border-circa-border',
              ].join(' ')}
            >
              <span
                className={
                  selected
                    ? 'text-white font-semibold text-sm'
                    : 'text-circa-text-secondary text-sm'
                }
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-circa-text-secondary text-center mt-2 min-h-[1.25rem]">
        {value !== null ? LABELS[value] : ''}
      </p>
    </div>
  );
}
