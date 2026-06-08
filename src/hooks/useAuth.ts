import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { syncOnConnect, flushQueue } from '@/lib/supabase/syncService';

// sessionStorage key used to persist the return path across the OAuth redirect.
const RETURN_PATH_KEY = 'circalog-auth-return-path';

interface ToastState {
  variant: 'success' | 'neutral' | 'error';
  message: string;
}

export function useAuth() {
  const [user, setUser]               = useState<User | null>(null);
  // true only while the initial getSession() call is in flight
  const [isLoading, setIsLoading]     = useState(true);
  const [activeToast, setActiveToast] = useState<ToastState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Guard all Supabase calls — supabase is null when env vars are absent.
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Restore any session that survived a page reload / OAuth redirect
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // Keep local state in sync with Supabase's auth events.
    // SIGNED_IN fires on a fresh OAuth completion; INITIAL_SESSION fires on
    // page reload — so the success toast only appears after an actual sign-in.
    // SIGNED_OUT covers both manual sign-out and token expiry.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN') {
          const name = session?.user?.user_metadata?.full_name as string | undefined;
          setActiveToast({
            variant: 'success',
            message: name ? `Welcome, ${name}!` : 'Signed in successfully.',
          });
          // Trigger full bidirectional sync now that we have a user.
          if (currentUser) syncOnConnect(currentUser);

          // If a return path was stored before the OAuth redirect, navigate
          // there now and clear the stored value.
          const returnPath = sessionStorage.getItem(RETURN_PATH_KEY);
          if (returnPath) {
            sessionStorage.removeItem(RETURN_PATH_KEY);
            navigate(returnPath, { replace: true });
          }
        }

        if (event === 'INITIAL_SESSION' && currentUser) {
          // App loaded with an existing session (e.g. page refresh while
          // signed in). Pull any remote entries the local store may be
          // missing.
          syncOnConnect(currentUser);
        }

        if (event === 'SIGNED_OUT') {
          setActiveToast({ variant: 'neutral', message: 'Signed out.' });
        }
      }
    );

    // Flush the sync queue when connectivity is restored.
    function handleOnline() {
      supabase!.auth.getSession().then(({ data }) => {
        if (data.session?.user) flushQueue(data.session.user);
      });
    }

    // Flush the sync queue when the user returns to the tab.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        supabase!.auth.getSession().then(({ data }) => {
          if (data.session?.user) flushQueue(data.session.user);
        });
      }
    }

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);

  /**
   * Initiates Google OAuth sign-in.
   *
   * @param returnPath - Optional app path to navigate to after sign-in
   *   completes (e.g. "/log/import"). If omitted, the user lands on "/log".
   *   The path is stored in sessionStorage before the OAuth redirect so it
   *   survives the full-page reload that OAuth requires.
   */
  async function signInWithGoogle(returnPath?: string): Promise<void> {
    if (!supabase) return;
    try {
      // Store the return path before leaving the page — the OAuth flow
      // performs a full redirect, so React state does not survive it.
      if (returnPath) {
        sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
      }
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: import.meta.env.VITE_APP_URL + '/log' },
      });
    } catch (err) {
      // Clean up the stored path if the sign-in call itself throws.
      sessionStorage.removeItem(RETURN_PATH_KEY);
      console.error('Google sign-in failed:', err);
      setActiveToast({ variant: 'error', message: 'Sign-in failed. Please try again.' });
    }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out failed:', err);
      setActiveToast({ variant: 'error', message: 'Sign-out failed. Please try again.' });
    }
  }

  function clearToast() {
    setActiveToast(null);
  }

  return { user, isLoading, signInWithGoogle, signOut, activeToast, clearToast };
}
