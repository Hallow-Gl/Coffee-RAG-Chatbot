import 'dotenv/config';
import {
  getCached, setCached, buildCacheKey,
  getL2Cached, setL2Cached
} from './cacheService.js';

// Custom error class for product retrieval failures.
// Carries structured info so callers can handle specific cases.
export class ProductSearchError extends Error {
  constructor(message, { code, retryable = false } = {}) {
    super(message);
    this.name    = 'ProductSearchError';
    this.code    = code;        // 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'NO_RESULTS'
    this.retryable = retryable; 
  }
}

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
    gl:      'ph', hl: 'en', num: '10',
  });

  let res;
  try {
    res = await fetch(`https://serpapi.com/search?${params}`);
  } catch (networkErr) {
    // fetch() itself threw — network down, DNS failure, timeout
    throw new ProductSearchError('Product search unavailable', {
      code: 'NETWORK_ERROR',
      retryable: true,
    });
  }

  if (res.status === 429) {
    throw new ProductSearchError('Monthly product search quota reached', {
      code: 'QUOTA_EXCEEDED',
      retryable: false,
    });
  }

  if (!res.ok) {
    throw new ProductSearchError(`SerpAPI error: ${res.status}`, {
      code: 'API_ERROR',
      retryable: res.status >= 500, // server errors are retryable, client errors are not
    });
  }

  const data = await res.json();
  if (!data.shopping_results?.length) return [];
  return data.shopping_results.slice(0, 8).map(normaliseProduct);
}

export async function searchProducts(query) {
  const key  = buildCacheKey(query);
  const hash = key; // query_hash in Supabase uses same normalised key

  // L1 — Redis
  const l1 = await getCached(key);
  if (l1) {
    console.log('[products] L1 hit (Redis):', key);
    return l1;
  }

  // L2 — Supabase
  const l2 = await getL2Cached(hash);
  if (l2) {
    console.log('[products] L2 hit (Supabase):', key);
    await setCached(key, l2); // backfill Redis
    return l2;
  }

  // Miss — call SerpAPI
  console.log('[products] cache miss — calling SerpAPI');
  try {
    const results = await callSerpAPI(query);
    await setCached(key, results);              // write L1
    await setL2Cached(hash, query, results);   // write L2
    return results;
  } catch (err) {
    if (err.code === 'QUOTA_EXCEEDED') {
      console.warn('[products] quota exceeded — returning empty');
      return [];
    }
    throw err;
  }
}