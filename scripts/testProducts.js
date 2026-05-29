import 'dotenv/config';
import { searchProducts } from '../src/services/productService.js';
import { buildCacheKey } from '../src/services/cacheService.js';



async function test() {
  const query = 'hand grinder';
  const key   = buildCacheKey(query);

  console.log('Cache key:', key);
  console.log('Expected: products:hand-grinder-philippines');

  console.log('--- First call (expect cache miss + SerpAPI call) ---');
  const results1 = await searchProducts(query);
  console.log(`Returned ${results1.length} products`);
  if (results1.length > 0) {
    console.log('First product:', JSON.stringify(results1[0], null, 2));
  }

  console.log('--- Second call (expect cache hit, 0 API calls) ---');
  const results2 = await searchProducts(query);
  console.log(`Returned ${results2.length} products (from cache)`);
}

test().catch(console.error);