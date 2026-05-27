import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function testQuery(query) {
  console.log(`
Query: "${query}"`);
  console.log('─'.repeat(55));
  const result = await embedModel.embedContent(query);
  const { data, error } = await supabase.rpc('match_coffee_knowledge', {
    query_embedding: result.embedding.values,
    match_count: 5,
  });
  if (error) { console.error(error.message); return; }
  if (!data.length) { console.log('No results above 0.75 threshold.'); return; }
  data.forEach((r, i) => {
    console.log(`${i+1}. [${(r.similarity*100).toFixed(1)}%] ${r.title}`);
  });
}

async function main() {
  await testQuery('Why does my espresso taste sour?');
  await testQuery('Best beginner grinder under 3000 pesos');
  await testQuery('French press vs moka pot for a student');
  await testQuery('What water temperature for dark roast?');
}

main();