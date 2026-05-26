import { supabase } from '../config/supabase.js';
import { embedText } from './embeddingService.js';

export async function retrieveContext(query, topK = 3) {
  const embedding = await embedText(query);

  const { data, error } = await supabase.rpc('match_coffee_knowledge', {
    query_embedding: embedding,
    match_count: topK,
  });

  if (error) throw error;
  return data;
}