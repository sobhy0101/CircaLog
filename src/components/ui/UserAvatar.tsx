import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Generic person icon shown when the Google avatar fails to load
function FallbackAvatar() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-circa-text-muted"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function UserAvatar() {
  const { user, signOut } = useAuth();
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const avatarUrl  = user.user_metadata?.avatar_url  as string | undefined;
  const fullName   = user.user_metadata?.full_name   as string | undefined;
  const displayName = fullName ?? user.email ?? 'Signed in';

  return (
    <div className="flex flex-col gap-2 px-6 py-4">
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        {/* 32 × 32 circular avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border border-circa-border flex-shrink-0 bg-circa-surface-raised flex items-center justify-center">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackAvatar />
          )}
        </div>
        <span className="text-sm font-medium text-circa-text-primary truncate">
          {displayName}
        </span>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="
          text-xs text-circa-text-secondary
          hover:text-circa-text-primary
          transition-colors text-left
        "
      >
        Sign out
      </button>
    </div>
  );
}
