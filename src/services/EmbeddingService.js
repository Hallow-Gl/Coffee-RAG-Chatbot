import 'dotenv/config';

export async function embedText(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] }
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Embedding failed');
  }

  return data.embedding.values;
}