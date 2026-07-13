const { LAUNCH_MODE_ALL_FREE, FREE_FEATURES } = require('../config/plan.config');

/**
 * Reads the feature key from route params (e.g. /api/entertainment/:feature)
 * and blocks access if the user's plan doesn't allow it.
 * ALWAYS runs server-side — never rely on the frontend hiding a locked button.
 */
function requireFeatureAccess(req, res, next) {
  if (LAUNCH_MODE_ALL_FREE) return next(); // everything unlocked during launch

  const { feature } = req.params;
  const { plan } = req.user;

  if (plan === 'basic') return next();
  if (FREE_FEATURES.includes(feature)) return next();

  return res.status(403).json({
    error: 'upgrade_required',
    message: 'This feature requires the Basic plan (₹499).',
    feature,
  });
}

module.exports = { requireFeatureAccess };
