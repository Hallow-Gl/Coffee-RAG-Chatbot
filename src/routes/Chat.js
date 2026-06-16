import { Router } from 'express';
import { retrieveContext }  from '../services/retrievalService.js';
import { generateAnswer }   from '../services/generationService.js';
import { searchProducts }   from '../services/productService.js';
import { detectIntent }     from '../services/intentService.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'message is required and must be a non-empty string'
      });
    }

    const query  = message.trim();
    const intent = detectIntent(query);

    console.log(`[chat] query: "${query}" | intent: ${intent}`);

    // --- parallel execution based on intent ---
    let chunks   = [];
    let products = [];

    if (intent === 'knowledge') {
      chunks = await retrieveContext(query, { topK: 5 });
    }
    else if (intent === 'product') {
      products = await searchProducts(query);
    }
    else {
      // combined — run both in parallel
      [chunks, products] = await Promise.all([
        retrieveContext(query, { topK: 5 }),
        searchProducts(query),
      ]);
    }

    // --- generate reply from knowledge chunks ---
    // pass empty chunks for product-only: Gemini will use its own knowledge
    const reply = await generateAnswer(query, chunks);

    // --- build sources ---
    const sources = chunks
      .filter(c => c.similarity !== null)
      .map(c => ({
        title:      c.title,
        category:   c.category,
        similarity: parseFloat((c.similarity * 100).toFixed(1)),
      }));

    // --- build products response ---
    // strip internal rerank fields the frontend doesn't need
    const productResponse = products.map(p => ({
      title:           p.title,
      price:           p.price,
      link:            p.link,
      source:          p.source,
      rating:          p.rating  ?? null,
      image:           p.image   ?? null,
      rerankScore:     p.rerankScore    ?? null,
      rerankReason:    p.rerankReason   ?? null,
      beginnerFriendly: p.beginnerFriendly ?? null,
    }));

    res.json({
      reply,
      intent,
      sources,
      products: productResponse,
    });

  } catch (err) {
    next(err);
  }
});