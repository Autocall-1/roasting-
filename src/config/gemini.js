const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[WARN] GEMINI_API_KEY not set in .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model name is configurable via env so it can be swapped (e.g. if a given
// project's free tier hasn't been granted quota for the default model yet)
// without touching code — just update GEMINI_MODEL on Render and redeploy.
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
console.log(`[Gemini] Using model: ${modelName}`);

const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

module.exports = { genAI, model };
