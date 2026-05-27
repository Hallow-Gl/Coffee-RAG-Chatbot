// scripts/listModels.js
import 'dotenv/config';

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const data = await res.json();

  if (!res.ok) {
    console.error('API error:', data.error?.message);
    return;
  }

  console.log('=== Models that support embedContent ===\n');
  const embedModels = data.models.filter(m =>
    m.supportedGenerationMethods?.includes('embedContent')
  );

  if (!embedModels.length) {
    console.log('NO embedding models found — API key may be restricted.');
  } else {
    embedModels.forEach(m => {
      console.log(`Name:    ${m.name}`);
      console.log(`Display: ${m.displayName}`);
      console.log(`Methods: ${m.supportedGenerationMethods.join(', ')}`);
      console.log('---');
    });
  }
}

listModels();