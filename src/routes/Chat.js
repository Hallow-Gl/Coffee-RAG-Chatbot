import { Router } from 'express';

export const chatRouter = Router();

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    res.json({
      reply: `Echo: ${message}`,
      sources: [],
      note: 'RAG pipeline not wired yet — Day 5 task',
    });
  } catch (err) {
    next(err);
  }
});