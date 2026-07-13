const { model } = require('../config/gemini');
const axios = require('axios');

/**
 * Fetches an image from a Cloudinary URL and converts it to base64
 * so it can be sent inline to Gemini.
 */
async function fetchImageAsBase64(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  return buffer.toString('base64');
}

/**
 * Runs a single Gemini vision call with a given prompt + image URL.
 * Returns parsed JSON (already forced via responseMimeType: application/json).
 */
async function runEntertainmentEngine(promptText, imageUrl) {
  const base64Image = await fetchImageAsBase64(imageUrl);

  const result = await model.generateContent([
    { text: promptText },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    },
  ]);

  const rawText = result.response.text();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    throw new Error('ai_response_parse_failed');
  }
}

module.exports = { runEntertainmentEngine };
