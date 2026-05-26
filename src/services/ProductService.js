import axios from 'axios';
import { redis } from '../config/redis.js';
import 'dotenv/config';

const CACHE_TTL = 60 * 60 * 24;

export async function searchProducts(query) {
  const cacheKey = `products:${query.toLowerCase().replace(/s+/g, '-')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'google_shopping',
      q: `${query} Philippines`,
      api_key: process.env.SERPAPI_KEY,
      gl: 'ph',
      hl: 'en',
    },
  });

  const results = data.shopping_results?.slice(0, 5) || [];
  await redis.set(cacheKey, results, { ex: CACHE_TTL });
  return results;
}