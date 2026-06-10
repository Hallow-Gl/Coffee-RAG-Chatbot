import 'dotenv/config';
import { searchProducts } from '../src/services/productService.js';
import { getCached, buildCacheKey } from '../src/services/cacheService.js';

// Queries most likely to be sent by beginners in the Philippines.
// Warming these on deploy means zero cache misses for common use cases.
const WARM_QUERIES = [
  'hand grinder',
  'french press',
  'moka pot',
  'pour over v60',
  'espresso machine beginner',
  'coffee beans Philippines',
  'gooseneck kettle',
  'coffee scale',
];

const delay = ms => new Promise(r => setTimeout(r, ms));

async function warmCache() {
  console.log(`Pre-warming cache for ${WARM_QUERIES.length} queries...
`);
  let warmed = 0;
  let skipped = 0;

  for (const query of WARM_QUERIES) {
    const key = buildCacheKey(query);
    const existing = await getCached(key);

    if (existing) {
      console.log(`⏭  Skipped (already cached): ${query}`);
      skipped++;
      continue;
    }

    try {
      const results = await searchProducts(query);
      console.log(`Warmed: ${query} → ${results.length} products`);
      warmed++;
      await delay(1200); // respect SerpAPI rate limits
    } catch (err) {
      console.warn(`Failed: ${query} — ${err.message}`);
    }
  }

  console.log(`
Done. Warmed: ${warmed} | Skipped: ${skipped} | Total quota used: ${warmed}`);
}

warmCache();