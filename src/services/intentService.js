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

const PRODUCT_TERMS = [
  'grinder', 'machine', 'maker', 'scale', 'kettle', 'beans',
  'filter', 'dripper', 'press', 'aeropress', 'v60',
];

const BREW_METHOD_TERMS = [
  'french press', 'espresso', 'pour over', 'pourover',
  'cold brew', 'moka pot', 'aeropress', 'v60',
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
  const asksWhatProduct = q.startsWith('what ') && PRODUCT_TERMS.some(s => q.includes(s));
  const hasBrewMethod = BREW_METHOD_TERMS.some(s => q.includes(s));

  if ((hasProduct && hasKnowledge) || (hasProduct && asksWhatProduct && hasBrewMethod)) {
    return 'combined';
  }
  if (hasProduct)                 return 'product';
  return 'knowledge'; // default — always answer with knowledge
}
