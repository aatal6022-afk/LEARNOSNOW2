import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../server/apiRouter';

const app = express();

app.disable('x-powered-by');

// CORS & Preflight headers for Vercel deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-Id, Cache-Control, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Standard Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount router on /api and root fallback for direct serverless invocation
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Express error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Server Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Handled API Error',
      status: 'error'
    });
  }
});

export default app;
