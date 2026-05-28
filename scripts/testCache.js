import 'dotenv/config';
import { redis } from '../src/config/redis.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function testTTL() {
  const key   = 'test:ttl-demo';
  const value = { product: 'Timemore C2', price: '₱1500' };
  const ttl   = 10; // seconds

  // --- WRITE ---
  // SET key value EX ttl  (EX = expire in N seconds)
  await redis.set(key, JSON.stringify(value), { ex: ttl });
  console.log('Stored in Redis with TTL:', ttl, 'seconds');

  // --- READ IMMEDIATELY (should exist) ---
  const immediate = await redis.get(key);
  console.log('Immediate read:', (immediate));

  // --- WAIT PAST TTL ---
  console.log('Waiting 12 seconds for TTL to expire...');
  await delay(12000);

  // --- READ AFTER EXPIRY (should be null) ---
  const expired = await redis.get(key);
  console.log('After expiry:', expired); 

  if (expired === null) {
    console.log('TTL confirmed — Redis auto-deleted the key after expiry');
  } else {
    console.log('TTL did not work — check your Upstash credentials');
  }
}

testTTL();