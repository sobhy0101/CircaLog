import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface ToastState {
  variant: 'success' | 'neutral' | 'error';
  message: string;
}

export function useAuth() {
  const [user, setUser]               = useState<User | null>(null);
  // true only while the initial getSession() call is in flight
  const [isLoading, setIsLoading]     = useState(true);
  const [activeToast, setActiveToast] = useState<ToastState | null>(null);

  useEffect(() => {
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
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN') {
          const name = session?.user?.user_metadata?.full_name as string | undefined;
          setActiveToast({
            variant: 'success',
            message: name ? `Welcome, ${name}!` : 'Signed in successfully.',
          });
        }

        if (event === 'SIGNED_OUT') {
          setActiveToast({ variant: 'neutral', message: 'Signed out.' });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle(): Promise<void> {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: import.meta.env.VITE_APP_URL + '/log' },
      });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setActiveToast({ variant: 'error', message: 'Sign-in failed. Please try again.' });
    }
  }

  async function signOut(): Promise<void> {
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
