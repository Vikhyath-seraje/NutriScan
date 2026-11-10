// services/geminiService.js
// ---------------------------------------------------------
// Google Gemini Vision AI Integration for NutriScan.
// Uses official @google/generative-ai SDK.
//
// Rules enforced:
// 1. Strict JSON schema contract
// 2. Identify all visible food items with portion estimates
// 3. Flag uncertainties (hidden ingredients, exact weights, cooking oils)
// 4. Handle non-food or blurry images safely
// ---------------------------------------------------------

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Helper to convert local image file to generative part
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

const SYSTEM_PROMPT = `You are a certified professional clinical nutritionist and computer vision food recognition expert.
Analyze the user-provided image of food and return ONLY a valid, raw JSON object (without markdown code blocks, backticks, or other text).

STRICT RULES:
1. Never claim 100% accuracy. Photographs cannot determine exact weight, hidden ingredients (oil, sugar, salt, butter), or preparation details.
2. If the image is not food or is empty/blurry, set "isFood": false and explain in "message".
3. Identify all distinct visible food items separately.
4. For each food item, provide an estimated realistic portion range in grams (min and max). Do not guess an exact weight.
5. Provide confidence level: "high", "medium", or "low".
6. Explicitly list any uncertainties or assumptions (e.g., "Assumed whole milk", "Cooking oil volume unknown").

OUTPUT JSON SCHEMA:
{
  "isFood": true,
  "confidenceScore": "medium",
  "items": [
    {
      "name": "Food Name (Common English / Indian Name)",
      "possibleIngredients": ["ingredient 1", "ingredient 2"],
      "preparationMethod": "steamed / fried / curry / raw / baked",
      "estimatedQuantityGrams": {
        "min": 80,
        "max": 120
      },
      "confidence": "high",
      "uncertainties": [
        "Portion volume estimated visually without reference scale",
        "Oil and salt content cannot be verified"
      ]
    }
  ],
  "overallUncertainty": [
    "Visual portion size is an approximation; user confirmation required before calculating nutrition.",
    "Hidden fats, sugars, and sauces may vary."
  ]
}`;

/**
 * Analyzes a meal photo using Google Gemini Vision.
 *
 * @param {string} imagePath - Path to local image file on server
 * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<Object>} Normalized food analysis result
 */
async function analyzeMealImage(imagePath, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback simulator if user hasn't set their real Gemini API key yet
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('⚠️ GEMINI_API_KEY is not configured in .env. Using realistic nutritional vision simulation fallback.');
    return simulateVisionAnalysis();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const imagePart = fileToGenerativePart(imagePath, mimeType);

    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const responseText = result.response.text().trim();

    // Clean potential markdown wrappers if returned
    let cleanedText = responseText;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedText);

    // Validate structure against contract
    if (typeof parsed.isFood !== 'boolean') {
      parsed.isFood = true;
    }
    if (!Array.isArray(parsed.items)) {
      parsed.items = [];
    }

    return parsed;
  } catch (error) {
    console.error('Gemini Vision API error:', error.message);
    // Graceful fallback to maintain app functionality
    return {
      isFood: true,
      items: [
        {
          name: 'Cooked Meal (Review item)',
          possibleIngredients: ['rice', 'vegetables', 'spices'],
          preparationMethod: 'cooked',
          estimatedQuantityGrams: { min: 150, max: 250 },
          confidence: 'medium',
          uncertainties: ['AI recognition experienced connection timeout; please verify food item name manually.'],
        },
      ],
      overallUncertainty: ['Please confirm or edit the recognized foods and quantities.'],
      fallbackUsed: true,
    };
  }
}

/**
 * Intelligent fallback simulator for demonstration/viva when offline or API key pending.
 */
function simulateVisionAnalysis() {
  return {
    isFood: true,
    simulated: true,
    items: [
      {
        name: 'Idli',
        possibleIngredients: ['rice', 'urad dal', 'fenugreek'],
        preparationMethod: 'steamed',
        estimatedQuantityGrams: { min: 80, max: 120 },
        confidence: 'high',
        uncertainties: ['Standard portion visually estimated (approx. 2 pieces)', 'Exact weight cannot be verified from 2D photo'],
      },
      {
        name: 'Sambar',
        possibleIngredients: ['toor dal', 'drumstick', 'tomato', 'tamarind', 'mustard seeds'],
        preparationMethod: 'boiled/simmered lentil stew',
        estimatedQuantityGrams: { min: 100, max: 150 },
        confidence: 'medium',
        uncertainties: ['Oil used for tadka cannot be verified', 'Vegetable proportion varies by recipe'],
      },
      {
        name: 'Coconut Chutney',
        possibleIngredients: ['fresh coconut', 'green chili', 'ginger', 'oil for tadka'],
        preparationMethod: 'ground raw with tempered oil',
        estimatedQuantityGrams: { min: 30, max: 50 },
        confidence: 'medium',
        uncertainties: ['Oil and coconut fat density cannot be determined visually'],
      },
    ],
    overallUncertainty: [
      'Visual portion size is an approximation; please confirm portion weights before calculating final calories.',
      'Hidden cooking fats and seasoning amounts are not visible in photograph.',
    ],
  };
}

module.exports = {
  analyzeMealImage,
  simulateVisionAnalysis,
};

