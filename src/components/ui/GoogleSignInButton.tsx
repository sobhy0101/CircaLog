import { useAuth } from '@/hooks/useAuth';

interface GoogleSignInButtonProps {
  /**
   * Optional app path to return to after sign-in completes.
   * Passed through to signInWithGoogle() and stored in sessionStorage
   * before the OAuth redirect so it survives the full-page reload.
   * Defaults to "/log" when omitted.
   */
  returnPath?: string;
}

export default function GoogleSignInButton({ returnPath }: GoogleSignInButtonProps) {
  const { isLoading, signInWithGoogle } = useAuth();

  // Don't render until auth state is known — avoids layout shift
  if (isLoading) return null;

  return (
    <button
      onClick={() => signInWithGoogle(returnPath)}
      className="
        flex items-center justify-center gap-2.5
        w-full min-h-[44px] px-4 py-2.5
        bg-circa-surface-raised
        border border-circa-border
        rounded-lg
        text-sm font-medium text-circa-text-primary
        hover:border-circa-border-strong
        hover:bg-circa-surface
        transition-colors
      "
    >
      {/* Google's official G mark for OAuth sign-in buttons */}
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    </button>
  );
}
