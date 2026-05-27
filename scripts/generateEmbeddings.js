import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const delay = ms => new Promise(r => setTimeout(r, ms));

  async function embedText(text) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: {
            parts: [{ text }]
          }
        })
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Embed failed');
    }

    return data.embedding.values;
  }

async function generateEmbeddings() {
  const { data: rows, error } = await supabase
    .from('coffee_knowledge')
    .select('id, title, content')
    .is('embedding', null);

  if (error) { console.error(error.message); process.exit(1); }
  if (!rows.length) { console.log('All rows already embedded.'); return; }

  console.log(`Embedding ${rows.length} chunks...\n`);

  for (const row of rows) {
    try {
      const embedding = await embedText(row.content);

      const { error: updateError } = await supabase
        .from('coffee_knowledge')
        .update({ embedding })
        .eq('id', row.id);

      if (updateError) {
        console.error(`  Failed ${row.id}:`, updateError.message);
      } else {
        console.log(`  Embedded [${embedding.length} dims]: ${row.title}`);
      }

      await delay(600);
    } catch (err) {
      console.error(`  Error on "${row.title}":`, err.message);
      await delay(1500);
    }
  }

  console.log('\nAll embeddings complete.');
}

generateEmbeddings();