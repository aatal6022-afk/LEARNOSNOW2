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

// Mount router on /api
app.use('/api', apiRouter);

// Also mount fallback without /api prefix for internal routing
app.use('/', apiRouter);

// Global Express error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Router Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal API Error',
      status: 'error'
    });
  }
});

export default function handler(req: Request, res: Response) {
  try {
    // Normalise incoming URL for Vercel rewrites
    const originalUrl = req.url || '/';
    if (!originalUrl.startsWith('/api') && !originalUrl.startsWith('/')) {
      req.url = `/${originalUrl}`;
    }

    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel API Handler Root Catch]:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'API_HANDLER_ERROR',
        message: String(error?.message || error)
      });
    }
    return res.end();
  }
}
