import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwwgfjzddhhaznlposnv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3d2dmanpkZGhoYXpubHBvc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDA2NzksImV4cCI6MjEwNjMxNjY3OX0.tvxWQ6dWh20SL0wCMrF-wDM2kZjDNpyQ_lhq3pX-owg';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign in using Supabase Auth (Email + Password)
 */
export async function signInWithSupabase(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
}

/**
 * Sign up a new user with metadata (name, role, phone, etc.)
 */
export async function signUpWithSupabase(email, password, metadata = {}) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutWithSupabase() {
  return await supabase.auth.signOut();
}

/**
 * Get current active session
 */
export async function getSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get current active authenticated user
 */
export async function getSupabaseUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
