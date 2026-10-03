import express from 'express';
import type { Request, Response } from 'express';
import { apiRouter } from '../server/apiRouter.ts';

const app = express();

// Enable JSON & urlencoded parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS & Preflight headers for Vercel deployment
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-Id');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Mount router on both /api and root paths
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default function handler(req: Request, res: Response) {
  try {
    // Vercel rewrite URL path recovery:
    // If Vercel rewrote /api/... to /api, recover the exact target path from headers or query
    const matchedPath = (req.headers['x-matched-path'] as string) || 
                        (req.headers['x-invoke-path'] as string) || 
                        (req.headers['x-vercel-matched-path'] as string);

    if (matchedPath && matchedPath !== '/api' && !req.url.startsWith(matchedPath)) {
      req.url = matchedPath;
    }

    // Support query parameter fallback (e.g. ?path=gemini/generate-path)
    if (req.query?.path && typeof req.query.path === 'string') {
      const qPath = req.query.path.startsWith('/') ? req.query.path : `/${req.query.path}`;
      req.url = `/api${qPath}`;
    }

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Execution error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'API_HANDLER_ERROR', message: String(error) });
    }
    return res.end();
  }
}
