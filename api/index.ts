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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-Id, Cache-Control, Accept');
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
    // 1. Recover path from Vercel rewrite wildcard match (query parameter '0' or 'path')
    const wildcardParam = (req.query?.['0'] as string) || (req.query?.path as string);
    const matchedPath = (req.headers['x-matched-path'] as string) || 
                        (req.headers['x-invoke-path'] as string) || 
                        (req.headers['x-vercel-matched-path'] as string) ||
                        (req.headers['x-forwarded-uri'] as string);

    if (wildcardParam && typeof wildcardParam === 'string' && wildcardParam.trim()) {
      const cleanSub = wildcardParam.startsWith('/') ? wildcardParam : `/${wildcardParam}`;
      req.url = `/api${cleanSub}`;
    } else if (matchedPath && matchedPath !== '/api' && !req.url.startsWith(matchedPath)) {
      req.url = matchedPath;
    }

    // Ensure req.url starts with / if empty
    if (!req.url || req.url === '') {
      req.url = '/';
    }

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API Handler] Execution error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'API_HANDLER_ERROR', message: String(error) });
    }
    return res.end();
  }
}
