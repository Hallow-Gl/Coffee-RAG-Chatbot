import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seed(entries) {
  console.log(`Seeding ${entries.length} entries...`);

  for (const entry of entries) {
    const { error } = await supabase
      .from('coffee_knowledge')
      .upsert(entry, { onConflict: 'title' });

    if (error) {
      console.error(`Failed: ${entry.title}`, error.message);
    } else {
      console.log(`Seeded: ${entry.title}`);
    }
  }

  console.log('Done.');
}

import { entries } from './knowledgeEntries.js';
seed(entries);