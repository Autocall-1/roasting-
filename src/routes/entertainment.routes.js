const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { requireFeatureAccess } = require('../middleware/plan.middleware');
const { runFeature, getHistory, getDashboard } = require('../controllers/entertainment.controller');

// POST /api/entertainment/:feature   body: { photoId }
// feature = funny_friend | savage_roast | flirty_ai | bollywood | standup_comedy
//         | meme_generator | instagram_comments | ai_judge | challenge | emoji_viral
//
// "Generate Again" on the frontend = just call this same endpoint again with the same photoId.
router.post('/:feature', requireAuth, requireFeatureAccess, runFeature);

// GET /api/entertainment/history/all
router.get('/history/all', requireAuth, getHistory);

// GET /api/entertainment/dashboard
// Powers the Entertainment Dashboard: Overall Entertainment Score, usage counts, recent results.
// "Share Button" on frontend = take any single result from history/dashboard and share its text
// via the Web Share API or a copy-to-clipboard action — no backend endpoint needed for that.
router.get('/dashboard', requireAuth, getDashboard);

module.exports = router;
