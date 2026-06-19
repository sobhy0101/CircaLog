import { useState } from 'react';
import { useSleepLog } from '@/hooks/useSleepLog';
import StartSleepScreen from './StartSleepScreen';
import ManualEntryForm  from './ManualEntryForm';
import WakeUpScreen     from './WakeUpScreen';

type View = 'start' | 'manual' | 'wakeup';

export default function LogPage() {
  const sleepLog = useSleepLog();

  // If a session was in progress before page reload, go straight to wakeup
  const [view, setView] = useState<View>(() =>
    sleepLog.inProgress ? 'wakeup' : 'start'
  );

  function handleStartSleep() {
    sleepLog.startSession();
    setView('wakeup');
  }

  function handleWakeComplete() {
    // clearSession is called inside WakeUpScreen before onComplete fires
    setView('start');
  }

  function handleAbandon() {
    // clearSession is called inside WakeUpScreen before onAbandon fires
    setView('start');
  }

  return (
    <div>
      <header className="px-4 pt-5 pb-2 flex items-center justify-between">
        <h1 className="text-circa-text-primary font-heading text-lg font-semibold tracking-wide">
          Sleep Log
        </h1>

        {view === 'start' && (
          <button
            onClick={() => setView('manual')}
            className="text-circa-accent-light text-sm min-h-11 flex items-center"
          >
            Log manually
          </button>
        )}

        {view === 'manual' && (
          <button
            onClick={() => setView('start')}
            aria-label="Back to log"
            className="text-circa-accent-light text-sm min-h-11 flex items-center"
          >
            ← Back
          </button>
        )}

        {/* No back button on wakeup — user must complete or abandon */}
      </header>

      {view === 'start' && (
        <StartSleepScreen
          onStartSleep={handleStartSleep}
          inProgress={sleepLog.inProgress}
        />
      )}

      {view === 'manual' && (
        <ManualEntryForm
          onSaved={() => setView('start')}
          onCancel={() => setView('start')}
          createEntry={sleepLog.createEntry}
          error={sleepLog.error}
          isLoading={sleepLog.isLoading}
        />
      )}

      {view === 'wakeup' && sleepLog.inProgress && (
        <WakeUpScreen
          inProgress={sleepLog.inProgress}
          onComplete={handleWakeComplete}
          onAbandon={handleAbandon}
          createEntry={sleepLog.createEntry}
          clearSession={sleepLog.clearSession}
          error={sleepLog.error}
          isLoading={sleepLog.isLoading}
        />
      )}
    </div>
  );
}
