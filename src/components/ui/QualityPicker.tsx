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
  return (
    <div>
      {label && (
        <p className="text-sm font-medium text-circa-text-primary mb-2">{label}</p>
      )}
      <div className="flex items-center justify-center gap-3 w-full px-4">
        {[1, 2, 3, 4, 5].map(n => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`Rate sleep quality ${n} out of 5`}
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
