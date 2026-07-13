const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('[WARN] GEMINI_API_KEY not set in .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Free-tier friendly model. Swap to gemini-2.0-flash / gemini-1.5-flash as needed.
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

module.exports = { genAI, model };
