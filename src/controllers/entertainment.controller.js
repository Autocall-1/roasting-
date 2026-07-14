const { db, admin } = require('../config/firebase');
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
    const photoDoc = await db.collection('photos').doc(photoId).get();
    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'photo_not_found' });
    }
    const photo = photoDoc.data();
    if (photo.user_id !== userId) {
      return res.status(403).json({ error: 'not_your_photo' });
    }

    const promptText = PROMPTS[feature];
    const result = await runEntertainmentEngine(promptText, photo.cloudinary_url);

    let savedId = null;
    let saved = true;
    try {
      const docRef = await db.collection('entertainment_results').add({
        user_id: userId,
        photo_id: photoId,
        feature,
        result,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      savedId = docRef.id;
    } catch (saveErr) {
      console.error('Save error:', saveErr);
      saved = false; // Still return the result to the user even if saving history failed
    }

    res.status(200).json({ feature, result, saved, id: savedId });
  } catch (err) {
    console.error('runFeature error:', err);
    res.status(500).json({ error: 'engine_failed', message: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const userId = req.user.id;
    const snap = await db
      .collection('entertainment_results')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json({ history });
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
    const snap = await db
      .collection('entertainment_results')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const data = snap.docs.map((d) => {
      const doc = d.data();
      return {
        id: d.id,
        ...doc,
        created_at: doc.created_at?.toDate ? doc.created_at.toDate().toISOString() : doc.created_at,
      };
    });

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
