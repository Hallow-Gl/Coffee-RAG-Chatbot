/**
 * intentService.js
 *
 * Classifies user query intent before deciding which services to invoke.
 * Keyword-based — zero API cost, runs synchronously.
 *
 * Returns: 'knowledge' | 'product' | 'combined'
 */

// signals that the user wants to buy something
const PRODUCT_SIGNALS = [
  'buy', 'purchase', 'recommend', 'best', 'good', 'cheap', 'affordable',
  'budget', 'under', 'below', 'worth', 'suggest', 'looking for',
  'where to get', 'how much', 'price', 'shopee', 'lazada',
  '₱', 'pesos', 'php',
];

// signals that the user wants to learn or troubleshoot
const KNOWLEDGE_SIGNALS = [
  'why', 'how', 'what is', 'explain', 'difference', 'vs',
  'compare', 'taste', 'bitter', 'sour', 'weak', 'ratio',
  'temperature', 'steps', 'guide', 'method', 'technique',
];

export function detectIntent(query) {
  const q = query.toLowerCase();

  const hasProduct   = PRODUCT_SIGNALS.some(s  => q.includes(s));
  const hasKnowledge = KNOWLEDGE_SIGNALS.some(s => q.includes(s));

  if (hasProduct && hasKnowledge) return 'combined';
  if (hasProduct)                 return 'product';
  return 'knowledge'; // default — always answer with knowledge
}