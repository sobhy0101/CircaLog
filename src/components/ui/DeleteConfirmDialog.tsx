import type { SleepEntry } from '@/lib/circadian';

interface DeleteConfirmDialogProps {
  entry: SleepEntry;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function DeleteConfirmDialog({
  entry,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmDialogProps) {
  return (
    // Full-screen scrim — tap outside = cancel
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      onClick={onCancel}
    >
      {/* Card — stop propagation so tapping the card doesn't cancel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="bg-circa-surface border border-circa-border rounded-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="delete-dialog-title" className="text-circa-text-primary font-semibold text-base mb-1">
          Delete this session?
        </h2>
        <p className="text-circa-text-secondary text-sm mb-5">
          Cycle {entry.cycleNumber} · {entry.sessionType === 'nap' ? 'Nap' : 'Main Sleep'}
          {' '}— this can't be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-circa-surface-raised
                       text-circa-text-secondary font-medium text-sm
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white
                       font-semibold text-sm disabled:opacity-50"
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
