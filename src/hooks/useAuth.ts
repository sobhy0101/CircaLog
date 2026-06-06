import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser]           = useState<User | null>(null);
  // true only while the initial getSession() call is in flight
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore any session that survived a page reload / OAuth redirect
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // Keep local state in sync with Supabase's auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
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
    }
  }

  async function signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  }

  return { user, isLoading, signInWithGoogle, signOut };
}
