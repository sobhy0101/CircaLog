// BottomTabBar.tsx — persistent bottom navigation bar with four tabs and hamburger trigger.
// Active tab is driven from the current route via useLocation.

import { useNavigate, useLocation } from 'react-router-dom';

interface BottomTabBarProps {
  onOpenDrawer: () => void;
}

export default function BottomTabBar({ onOpenDrawer }: BottomTabBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Determine active tab from current path
  const isLog     = pathname === '/log';
  const isChart   = pathname === '/log/chart';
  const isHistory = pathname === '/log/history';

  function tabClass(active: boolean) {
    return (
      'flex flex-col items-center justify-center gap-1 flex-1 transition-colors ' +
      (active ? 'text-circa-accent' : 'text-circa-text-secondary hover:text-circa-accent')
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-circa-surface border-t border-circa-border flex items-stretch z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      {/* Hamburger — opens side drawer */}
      <button
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="flex items-center justify-center min-w-11 min-h-11 px-3 text-circa-text-secondary hover:text-circa-accent transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Tab area — equal-width flex children */}
      <div className="flex flex-1">
        {/* Log tab */}
        <button
          onClick={() => navigate('/log')}
          aria-label="Log"
          aria-current={isLog ? 'page' : undefined}
          className={tabClass(isLog)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Pencil / edit icon */}
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span className="text-xs">Log</span>
        </button>

        {/* Chart tab */}
        <button
          onClick={() => navigate('/log/chart')}
          aria-label="Chart"
          aria-current={isChart ? 'page' : undefined}
          className={tabClass(isChart)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Bar chart — three vertical bars */}
            <rect x="3"  y="12" width="4" height="10" rx="1" />
            <rect x="10" y="7"  width="4" height="15" rx="1" />
            <rect x="17" y="3"  width="4" height="19" rx="1" />
          </svg>
          <span className="text-xs">Chart</span>
        </button>

        {/* History tab */}
        <button
          onClick={() => navigate('/log/history')}
          aria-label="History"
          aria-current={isHistory ? 'page' : undefined}
          className={tabClass(isHistory)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Clock icon */}
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
          <span className="text-xs">History</span>
        </button>

        {/* Insights tab — not yet implemented */}
        <button
          aria-label="Insights"
          className={tabClass(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Four-point sparkle / star */}
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
          </svg>
          <span className="text-xs">Insights</span>
        </button>
      </div>
    </nav>
  );
}
