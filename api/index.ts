import express from 'express';
import type { Request, Response } from 'express';
import { apiRouter } from '../server/apiRouter.ts';

const app = express();

app.disable('x-powered-by');

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

// Safe Body Parsing
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.json({ limit: '15mb' })(req, res, (err) => {
    if (err) return next();
    express.urlencoded({ extended: true, limit: '15mb' })(req, res, next);
  });
});

// Mount router on /api
app.use('/api', apiRouter);

// Also mount fallback without /api prefix for internal routing
app.use('/', apiRouter);

// Global Express error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Router Error]:', err);
  if (!res.headersSent) {
    res.status(200).json({
      success: false,
      error: err?.message || 'Handled API Error',
      status: 'error'
    });
  }
});

export default function handler(req: Request, res: Response) {
  return new Promise<void>((resolve) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', () => resolve());

    try {
      app(req, res, (err: any) => {
        if (err && !res.headersSent) {
          res.status(200).json({
            success: false,
            error: err?.message || 'Server Error'
          });
        }
        resolve();
      });
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(200).json({
          success: false,
          error: err?.message || 'Execution Error'
        });
      }
      resolve();
    }
  });
}

