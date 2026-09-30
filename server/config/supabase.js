const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://lwwgfjzddhhaznlposnv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[SUPABASE] Backend Admin Client initialized with Service Role successfully.');
  } catch (err) {
    console.error('[SUPABASE] Failed to initialize Supabase admin client:', err.message);
  }
} else {
  console.warn('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY not configured. Running in local standalone mode.');
}

module.exports = supabase;
