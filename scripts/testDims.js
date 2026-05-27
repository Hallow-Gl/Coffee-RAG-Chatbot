// scripts/testDims.js
import 'dotenv/config';

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text: 'test' }] }
    })
  }
);
const data = await res.json();
console.log('Dims:', data.embedding.values.length);