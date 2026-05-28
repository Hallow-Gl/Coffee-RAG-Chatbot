import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { rawEntries } from './knowledgeEntries.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function chunkByHeadings(entry, minWords = 80) {
  const lines = entry.markdown.trim().split('\n').map(l => l.trimStart());
  const raw = [];
  let heading = null;
  let body = [];

  const HEADING_RE = /^#{2,3}\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(HEADING_RE);

    if (match) {
      if (heading !== null) {
        raw.push({ heading, body: body.join('\n').trim() });
      }
      heading = match[1].trim(); // captures only the text after ##
      body = [];
    } else {
      body.push(line);
    }
  }

  const merged = [];
  for (const chunk of raw) {
    const words = chunk.body.split(/s+/).filter(Boolean).length;
    if (words < minWords && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.body += '' + chunk.heading + '' + chunk.body;
    } else {
      merged.push({ ...chunk });
    }
  }

  return merged.map(chunk => ({
    title: `${entry.title} — ${chunk.heading}`,
    category: entry.category,
    content: `Context: ${entry.title}

## ${chunk.heading}

${chunk.body}`,
    embedding: null,
    metadata: {
      ...entry.metadata,
      parent_topic: entry.title,
      section: chunk.heading,
    },
  }));
}

async function seed() {
  const chunks = rawEntries.flatMap(chunkByHeadings);
  console.log(`Seeding ${chunks.length} chunks from ${rawEntries.length} entries...
`);

  for (const chunk of chunks) {
    const { error } = await supabase
      .from('coffee_knowledge')
      .upsert(chunk, { onConflict: 'title' });

    if (error) {
      console.error(`  Failed: ${chunk.title}`, error.message);
    } else {
      console.log(`  Seeded: ${chunk.title}`);
    }
  }

  console.log('Done.');
}

seed();