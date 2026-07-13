/**
 * LAUNCH MODE: set to true = every feature is free right now (as requested for launch).
 * When you're ready to start charging, flip this to false — the per-feature
 * FREE_FEATURES list below immediately takes effect without touching any route/controller code.
 */
const LAUNCH_MODE_ALL_FREE = true;

// This is the list that will matter once LAUNCH_MODE_ALL_FREE is set to false.
// Edit anytime — no other code changes needed.
const FREE_FEATURES = [
  'funny_friend',
  'meme_generator',
  'emoji_viral',
  'ai_judge',
];

module.exports = { LAUNCH_MODE_ALL_FREE, FREE_FEATURES };
