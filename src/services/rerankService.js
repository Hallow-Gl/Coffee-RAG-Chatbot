import { SchemaType } from '@google/generative-ai';
import { genAI } from '../config/gemini.js';

const MIN_SCORE = 0;
const MAX_SCORE = 10;

const rerankModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0,
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        rankings: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              index: { type: SchemaType.INTEGER },
              score: { type: SchemaType.NUMBER },
              reason: { type: SchemaType.STRING },
              beginnerFriendly: { type: SchemaType.BOOLEAN },
              keep: { type: SchemaType.BOOLEAN },
            },
            required: ['index', 'score', 'reason', 'beginnerFriendly', 'keep'],
          },
        },
      },
      required: ['rankings'],
    },
  },
});

function isValidQuery(query) {
  return typeof query === 'string' && query.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toSafeString(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function normaliseProductsForPrompt(products) {
  return products.map((product, index) => ({
    index,
    title: toSafeString(product?.title, 'Unknown product'),
    price: toSafeString(product?.price, 'Price unavailable'),
    source: toSafeString(product?.source, 'Unknown seller'),
    rating: product?.rating ?? null,
  }));
}

function stripCodeFence(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseGeminiJson(text) {
  if (typeof text !== 'string' || text.trim().length === 0) return null;

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parseScore(value) {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
}

function parseRankingEntry(entry, productCount) {
  if (!isPlainObject(entry)) return null;

  const index = Number(entry.index);
  if (!Number.isInteger(index) || index < 0 || index >= productCount) return null;

  const score = parseScore(entry.score);
  if (score === null) return null;

  return {
    index,
    score,
    reason: toSafeString(entry.reason, 'No reason provided'),
    beginnerFriendly: entry.beginnerFriendly === true,
    keep: entry.keep !== false,
  };
}

function validateRankings(payload, productCount) {
  if (!isPlainObject(payload) || !Array.isArray(payload.rankings)) return null;

  const seen = new Set();
  const rankings = [];

  for (const entry of payload.rankings) {
    const ranking = parseRankingEntry(entry, productCount);
    if (!ranking || seen.has(ranking.index)) continue;
    seen.add(ranking.index);
    rankings.push(ranking);
  }

  return rankings.length > 0 ? rankings : null;
}

function buildRerankPrompt(query, products) {
  return `You are a deterministic product ranking system for BrewBuddy, a coffee assistant for the Philippine market.

TASK:
Evaluate these coffee products against the user's query. Keep only appropriate products, score them from 0 to 10, and return the result as valid JSON only.

SCORING CRITERIA:
1. Relevance to the user's exact coffee product request.
2. Budget fit when the query mentions a budget or price range.
3. Beginner friendliness.
4. Value for money.
5. Availability or likely availability in the Philippine market.
6. Coffee-specific suitability.

IMPORTANT:
- The best product is the most appropriate product, not the most expensive product.
- Penalize products that are unrelated, outside budget, too advanced for a beginner request, poor value, or not suitable for coffee.
- If a product is a poor match, set keep to false.
- Use each product's index exactly as provided.
- Return valid JSON only.
- Do not use markdown.
- Do not use code fences.
- Do not include explanations outside JSON.
- Do not add fields outside the schema.

JSON SCHEMA:
{
  "rankings": [
    {
      "index": 0,
      "score": 8.5,
      "reason": "Short reason for the score",
      "beginnerFriendly": true,
      "keep": true
    }
  ]
}

USER QUERY:
${query.trim()}

PRODUCTS:
${JSON.stringify(products)}`;
}

async function requestGeminiRanking(prompt, model) {
  const result = await model.generateContent(prompt);
  return result?.response?.text?.() ?? '';
}

/**
 * Reranks product results with Gemini while preserving product retrieval stability.
 *
 * Returns the original products unchanged whenever validation, Gemini, or parsing fails.
 *
 * @param {string} query User product search query.
 * @param {Array<object>} products SerpAPI-normalized product results.
 * @param {object} [options] Optional test hooks.
 * @param {object} [options.model] Gemini-compatible model with generateContent().
 * @returns {Promise<Array<object>>} Reranked and filtered products, or the original products.
 */
export async function rerankProducts(query, products, options = {}) {
  if (!isValidQuery(query)) {
    console.warn('[rerank] invalid query - returning original products');
    return Array.isArray(products) ? products : [];
  }

  if (!Array.isArray(products)) {
    console.warn('[rerank] invalid products array - returning empty list');
    return [];
  }

  if (products.length === 0) return products;

  const model = options.model ?? rerankModel;
  const promptProducts = normaliseProductsForPrompt(products);
  const prompt = buildRerankPrompt(query, promptProducts);

  try {
    console.log('\n[rerank] === INPUT DEBUG ===');
    console.log('Query:', query);
    console.log('Product count:', products.length);

    const rawText = await requestGeminiRanking(prompt, model);

    console.log('\n[rerank] === GEMINI RAW OUTPUT ===');
    console.log(rawText);

    const payload = parseGeminiJson(rawText);

    console.log('\n[rerank] === PARSED PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));

    const rankings = validateRankings(payload, products.length);

    if (!rankings) {
      console.warn('[rerank] invalid Gemini rankings - returning original products');
      return products;
    }

    console.log('\n[rerank] === VALID RANKINGS ===');
    console.log(JSON.stringify(rankings, null, 2));

    const reranked = rankings
      .filter(ranking => ranking.keep)
      .map(ranking => ({
        ...products[ranking.index],
        rerankScore: ranking.score,
        rerankReason: ranking.reason,
        beginnerFriendly: ranking.beginnerFriendly,
      }))
      .sort((a, b) => b.rerankScore - a.rerankScore);

    console.log('\n[rerank] === FINAL RERANKED OUTPUT ===');
    reranked.forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.title} (${p.rerankScore})`
      );
      if (p.rerankReason) {
        console.log(`   → ${p.rerankReason}`);
      }
    });

    return reranked;
  } catch (err) {
    console.warn(
      '[rerank] Gemini reranking failed - returning original products:',
      err.message
    );
    return products;
  }
}