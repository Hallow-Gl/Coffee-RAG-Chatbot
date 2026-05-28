import { Router } from 'express';
import { retrieveContext } from '../services/retrievalService.js';
import { generateAnswer } from '../services/generationService.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required and must be a non-empty string' });
    }

    const query = message.trim();

    // step 1 — retrieve relevant chunks
    const chunks = await retrieveContext(query, { topK: 5 });

    // step 2 — generate answer from chunks
    const reply = await generateAnswer(query, chunks);

    // step 3 — build sources list for transparency
    const sources = chunks
      .filter(c => c.similarity !== null)
      .map(c => ({
        title: c.title,
        category: c.category,
        similarity: parseFloat((c.similarity * 100).toFixed(1))
      }));

    res.json({ reply, sources });

  } catch (err) {
    next(err);
  }
});