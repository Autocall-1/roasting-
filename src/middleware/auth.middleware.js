const { supabaseAdmin } = require('../config/supabase');

/**
 * Verifies the Supabase access token sent from frontend as:
 *   Authorization: Bearer <token>
 * Attaches req.user = { id, email, plan } on success.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'missing_token' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    // Fetch plan from profiles table (never trust a client-sent plan value)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', data.user.id)
      .single();

    if (profileErr) {
      return res.status(500).json({ error: 'profile_lookup_failed' });
    }

    const planActive =
      profile.plan === 'basic' &&
      (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());

    req.user = {
      id: data.user.id,
      email: data.user.email,
      plan: planActive ? 'basic' : 'free',
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'auth_check_failed' });
  }
}

module.exports = { requireAuth };
