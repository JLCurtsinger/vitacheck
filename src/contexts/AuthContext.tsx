import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { upsertProfileForUser, fetchUserProfile, getDisplayName, getUserRole } from '@/lib/api/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  displayName: string | null;
  role: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; role: string } | null>(null);
  const navigate = useNavigate();

  console.log("AuthProvider render", {
    isLoading,
    hasUser: !!user,
  });

  useEffect(() => {
    let isMounted = true;
    let initialHandled = false;

    console.log("AuthContext: subscribing to onAuthStateChange");

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log("AuthContext: onAuthStateChange", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(supabase, session.user.id);
          setProfile(userProfile);
        } catch (profileError) {
          console.error('Error loading profile in onAuthStateChange', profileError);
        }
      } else {
        setProfile(null);
      }

      if (!initialHandled) {
        initialHandled = true;
        console.log("AuthContext: initial auth state handled, setIsLoading(false)");
        setIsLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: unsubscribe");
      isMounted = false;
      try {
        data?.subscription?.unsubscribe();
      } catch (err) {
        console.error("AuthContext: unsubscribe error", err);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/check');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName ?? null,
            role: 'general',
          },
        },
      });
      if (error) {
        // Preserve the Supabase error with code and message
        setError(error.message);
        throw error;
      }
      
      // Upsert profile after successful signup
      if (data.user) {
        await upsertProfileForUser(supabase, data.user);
        const userProfile = await fetchUserProfile(supabase, data.user.id);
        setProfile(userProfile);
      }
      
      // Show success message or redirect
    } catch (err) {
      // Re-throw the error so callers can inspect error.code and error.message
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const redirectTo = import.meta.env.VITE_SITE_URL
        ? `${import.meta.env.VITE_SITE_URL}/auth/reset`
        : `${window.location.origin}/auth/reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        setError(error.message);
        throw error;
      }
    } catch (err) {
      // Re-throw the error so callers can inspect error.code and error.message
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setError(error.message);
        throw error;
      }
      // On success, don't log out; just resolve
    } catch (err) {
      // Re-throw the error so callers can inspect error.message
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = getDisplayName(user, profile);
  const role = getUserRole(user, profile);

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    displayName,
    role,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
