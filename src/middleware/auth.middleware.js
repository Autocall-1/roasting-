const { auth, db } = require('../config/firebase');

/**
 * Verifies the Firebase ID token sent from frontend as:
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

    let decoded;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    // Fetch plan from the `profiles` collection (never trust a client-sent plan value)
    const profileSnap = await db.collection('profiles').doc(decoded.uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : { plan: 'free' };

    const expiresAt = profile.plan_expires_at?.toDate ? profile.plan_expires_at.toDate() : profile.plan_expires_at;
    const planActive = profile.plan === 'basic' && (!expiresAt || new Date(expiresAt) > new Date());

    req.user = {
      id: decoded.uid,
      email: decoded.email,
      plan: planActive ? 'basic' : 'free',
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'auth_check_failed' });
  }
}

module.exports = { requireAuth };
