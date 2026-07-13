const { supabaseAdmin } = require('../config/supabase');
const { runEntertainmentEngine } = require('../services/gemini.service');
const { PROMPTS } = require('../prompts/entertainment.prompts');

const VALID_FEATURES = Object.keys(PROMPTS);

async function runFeature(req, res) {
  try {
    const { feature } = req.params;
    const { photoId } = req.body;
    const userId = req.user.id;

    if (!VALID_FEATURES.includes(feature)) {
      return res.status(400).json({ error: 'invalid_feature', valid: VALID_FEATURES });
    }
    if (!photoId) {
      return res.status(400).json({ error: 'photoId_required' });
    }

    // Confirm the photo belongs to this user
    const { data: photo, error: photoErr } = await supabaseAdmin
      .from('photos')
      .select('id, cloudinary_url, user_id')
      .eq('id', photoId)
      .single();

    if (photoErr || !photo) {
      return res.status(404).json({ error: 'photo_not_found' });
    }
    if (photo.user_id !== userId) {
      return res.status(403).json({ error: 'not_your_photo' });
    }

    const promptText = PROMPTS[feature];
    const result = await runEntertainmentEngine(promptText, photo.cloudinary_url);

    const { data: saved, error: saveErr } = await supabaseAdmin
      .from('entertainment_results')
      .insert({
        user_id: userId,
        photo_id: photoId,
        feature,
        result,
      })
      .select()
      .single();

    if (saveErr) {
      console.error('Save error:', saveErr);
      // Still return the result to the user even if saving history failed
      return res.status(200).json({ feature, result, saved: false });
    }

    res.status(200).json({ feature, result, saved: true, id: saved.id });
  } catch (err) {
    console.error('runFeature error:', err);
    res.status(500).json({ error: 'engine_failed', message: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('entertainment_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ history: data });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'history_fetch_failed' });
  }
}

// Scans a result object for numeric fields in the 1-10 range and averages them,
// used to build an "Overall Entertainment Score" for the dashboard.
function extractScores(obj, acc = []) {
  if (!obj || typeof obj !== 'object') return acc;
  for (const value of Object.values(obj)) {
    if (typeof value === 'number' && value >= 0 && value <= 10) {
      acc.push(value);
    } else if (typeof value === 'object') {
      extractScores(value, acc);
    }
  }
  return acc;
}

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('entertainment_results')
      .select('feature, result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const allScores = [];
    const featureCounts = {};

    for (const row of data) {
      featureCounts[row.feature] = (featureCounts[row.feature] || 0) + 1;
      extractScores(row.result, allScores);
    }

    const overallScore = allScores.length
      ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1))
      : null;

    res.status(200).json({
      overall_entertainment_score: overallScore,
      total_generations: data.length,
      feature_usage: featureCounts,
      recent: data.slice(0, 10),
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: 'dashboard_fetch_failed' });
  }
}

module.exports = { runFeature, getHistory, getDashboard, VALID_FEATURES };
