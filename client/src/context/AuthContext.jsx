import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured, signInWithSupabase, signUpWithSupabase, signOutWithSupabase } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session from Supabase and LocalStorage
  useEffect(() => {
    let subscription = null;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          // 1. Check active Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session?.user && !error) {
            const sbUser = session.user;
            const mappedUser = {
              id: sbUser.id,
              email: sbUser.email,
              name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
              role: sbUser.user_metadata?.role || 'donor',
              phone: sbUser.user_metadata?.phone || '',
              ...sbUser.user_metadata
            };
            setUser(mappedUser);
            localStorage.setItem('user', JSON.stringify(mappedUser));
            localStorage.setItem('token', session.access_token);
            setLoading(false);
            return;
          }

          // 2. Set up auth state change listener
          const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
              const sbUser = session.user;
              const mappedUser = {
                id: sbUser.id,
                email: sbUser.email,
                name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
                role: sbUser.user_metadata?.role || 'donor',
                phone: sbUser.user_metadata?.phone || '',
                ...sbUser.user_metadata
              };
              setUser(mappedUser);
              localStorage.setItem('user', JSON.stringify(mappedUser));
              localStorage.setItem('token', session.access_token);
            } else if (event === 'TOKEN_REFRESHED' && session) {
              localStorage.setItem('token', session.access_token);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          });
          subscription = subData?.subscription;
        }
      } catch (err) {
        console.warn('[AuthContext] Supabase init check notice:', err.message);
      }

      // 3. Fallback: restore saved demo user / local token if present
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }

    initializeAuth();

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password, role) => {
    try {
      // 1. Attempt Supabase Auth login first if configured
      if (isSupabaseConfigured) {
        const { data, error } = await signInWithSupabase(email, password);
        if (!error && data?.session?.user) {
          const sbUser = data.session.user;
          const mappedUser = {
            id: sbUser.id,
            email: sbUser.email,
            name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
            role: sbUser.user_metadata?.role || role || 'donor',
            phone: sbUser.user_metadata?.phone || '',
            ...sbUser.user_metadata
          };
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
          localStorage.setItem('token', data.session.access_token);
          return { success: true, user: mappedUser, provider: 'supabase' };
        }
      }

      // 2. Fallback to backend API login (for seeded demo accounts & local dev)
      const data = await api.login(email, password, role);
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        return { success: true, user: data.user, provider: 'api' };
      }

      return { success: false, message: data.message || 'Authentication failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const register = async (email, password, metadata = {}) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await signUpWithSupabase(email, password, metadata);
        if (error) {
          return { success: false, message: error.message };
        }
        if (data?.session?.user) {
          const sbUser = data.session.user;
          const mappedUser = {
            id: sbUser.id,
            email: sbUser.email,
            name: metadata.name || sbUser.email.split('@')[0],
            role: metadata.role || 'donor',
            ...metadata
          };
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
          localStorage.setItem('token', data.session.access_token);
          return { success: true, user: mappedUser, session: data.session };
        }
        return { 
          success: true, 
          user: data?.user, 
          message: 'Account created! Please verify your email or sign in directly.' 
        };
      }
      return { success: false, message: 'Supabase is not configured' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await signOutWithSupabase();
      }
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
