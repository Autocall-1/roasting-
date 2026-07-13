const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-side only, never expose to frontend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[WARN] Supabase env vars missing');
}

// Service-role client — bypasses RLS, use ONLY in trusted backend code
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabaseAdmin };
