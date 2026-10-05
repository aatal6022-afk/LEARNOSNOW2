import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/apiRouter';
import { securityHeaders, apiRateLimiter, sanitizeInputMiddleware } from './server/securityMiddleware';

process.on('unhandledRejection', (reason) => {
  console.warn('[Server Unhandled Rejection Caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception Caught]:', err?.message || err);
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.disable('x-powered-by');

  // OWASP Standard Security Headers
  app.use(securityHeaders);

  // Universal CORS & Preflight headers for production VM
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-Id, Cache-Control, Accept, cf-turnstile-token, x-turnstile-token');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Strict Payload Limit & Parsing with Anti-Prototype-Pollution Sanitization
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(sanitizeInputMiddleware);

  // Anti-DDoS & Sliding Window Rate Limiting on /api
  app.use('/api', apiRateLimiter);

  // API Endpoints mounted on real Express application
  app.use('/api', apiRouter);

  // Serve Standalone PinkInAu Corporate Landing Page
  const pinkinauLandingPath = path.resolve(process.cwd(), 'pinkinau-landing');
  app.use('/pinkinau', express.static(pinkinauLandingPath));
  app.use('/company', express.static(pinkinauLandingPath));
  app.get('/company', (req, res) => res.sendFile(path.join(pinkinauLandingPath, 'index.html')));
  app.get('/pinkinau', (req, res) => res.sendFile(path.join(pinkinauLandingPath, 'index.html')));

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production' && !process.env.SERVE_STATIC) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Learning OS server running on http://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
  server.setTimeout(300000);
  server.headersTimeout = 300000;
  server.requestTimeout = 300000;
}

startServer();
