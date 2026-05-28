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

  console.log('=== Models that support generateContent ===\n');
  const chatModels = data.models.filter(m =>
    m.supportedGenerationMethods?.includes('generateContent')
  );

  chatModels.forEach(m => {
    console.log(`Name:    ${m.name}`);
    console.log(`Display: ${m.displayName}`);
    console.log(`Methods: ${m.supportedGenerationMethods.join(', ')}`);
    console.log('---');
  });
}

listModels();