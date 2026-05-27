import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function test() {
  console.log('Testing Supabase connection...');

  const { data, error } = await supabase
    .from('coffee_knowledge')
    .select('id, title, category')
    .limit(5);

  if (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }

  console.log('Connected! Rows returned:', data.length);
  console.log('Table is empty (expected before seeding):', data);
}

test();