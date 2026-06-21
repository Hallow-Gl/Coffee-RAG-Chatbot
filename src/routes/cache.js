import { Router } from 'express';

export const cacheRouter = Router();

function blockCacheInProduction(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).type('text/plain').send('Cache endpoints are disabled in production');
  }

  next();
}

cacheRouter.get('/status', blockCacheInProduction, (req, res) => {
  res.json({ status: 'ok', cache: 'available' });
});

cacheRouter.delete('/invalidate', blockCacheInProduction, (req, res) => {
  res.json({ status: 'ok', message: 'Cache invalidation endpoint available in development' });
});
