import 'dotenv/config';
import { getCached, setCached, buildCacheKey } from './cacheService.js';

function normaliseProduct(item) {
  return {
    title:  item.title        || 'Unknown product',
    price:  item.price        || 'Price unavailable',
    link:   item.link         || item.product_link || '#',
    source: item.source       || 'Unknown seller',
    rating: item.rating       || null,
    image:  item.thumbnail    || null,
  };
}

async function callSerpAPI(query) {
  const params = new URLSearchParams({
    engine:  'google_shopping',
    q:       `${query} Philippines`,
    api_key: process.env.SERPAPI_KEY,
    gl:      'ph',
    hl:      'en',
    num:     '10',
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status} ${res.statusText}`);

  const data = await res.json();

  if (!data.shopping_results?.length) return [];
  return data.shopping_results.slice(0, 8).map(normaliseProduct);
}

export async function searchProducts(query) {
  const key    = buildCacheKey(query);
  const cached = await getCached(key);

  if (cached) {
    console.log('[products] cache hit:', key);
    return cached;
  }

  console.log('[products] cache miss — calling SerpAPI');
  const results = await callSerpAPI(query);
  await setCached(key, results);
  return results;
}