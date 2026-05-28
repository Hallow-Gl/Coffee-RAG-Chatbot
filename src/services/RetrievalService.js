import { supabase } from '../config/supabase.js';
import { embedText } from './embeddingService.js';

export async function retrieveContext(query, options = {}) {
  const { topK = 5, category = null } = options;

  const embedding = await embedText(query);

  // primary search — threshold 0.70
  const { data, error } = await supabase.rpc('match_coffee_knowledge', {
    query_embedding: embedding,
    match_count: topK,
    filter_category: category
  });

  if (error) throw new Error(`Retrieval failed: ${error.message}`);

  // fallback for comparison/broad queries that score below threshold
  if (!data || data.length === 0) {
    console.log('[retrieval] no results above threshold — using fallback top-3');

    const { data: fallback, error: fallbackError } = await supabase
      .from('coffee_knowledge')
      .select('id, title, category, content, metadata')
      .not('embedding', 'is', null)
      .limit(3);

    if (fallbackError) throw new Error(`Fallback failed: ${fallbackError.message}`);

    return (fallback || []).map(r => ({ ...r, similarity: null }));
  }

  return data;
}