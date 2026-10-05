import type { Request, Response, NextFunction } from 'express';

// ============================================================================
// 1. Sliding Window Rate Limiter
// Prevents API spam, DoS, and automated scraping of heavy Gemini AI routes.
// ============================================================================

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const AI_WINDOW_MS = 60 * 1000; // 1 minute
const AI_MAX_REQUESTS_PER_WINDOW = 45; // 45 AI generations per minute per client
const GENERAL_MAX_REQUESTS_PER_WINDOW = 150; // 150 general API calls per minute

// Cleanup stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < AI_WINDOW_MS);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Extract client IP address safely
  const clientIp = (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  ).trim();

  const isAiRoute = req.path.startsWith('/gemini') || req.path.startsWith('/code/run') || req.path.startsWith('/epistemic');
  const maxLimit = isAiRoute ? AI_MAX_REQUESTS_PER_WINDOW : GENERAL_MAX_REQUESTS_PER_WINDOW;
  const key = `${clientIp}:${isAiRoute ? 'ai' : 'gen'}`;

  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < AI_WINDOW_MS);

  if (record.timestamps.length >= maxLimit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const retryAfterSec = Math.ceil((AI_WINDOW_MS - (now - oldestTimestamp)) / 1000);

    res.setHeader('Retry-After', String(retryAfterSec));
    res.setHeader('X-RateLimit-Limit', String(maxLimit));
    res.setHeader('X-RateLimit-Remaining', '0');

    console.warn(`[Security RateLimiter] IP ${clientIp} exceeded rate limit on ${req.originalUrl}. Blocked for ${retryAfterSec}s.`);
    return res.status(429).json({
      error: 'Превышен лимит запросов к системе. Пожалуйста, подождите немного перед следующим действием.',
      retryAfterSeconds: retryAfterSec,
      rateLimitExceeded: true,
    });
  }

  record.timestamps.push(now);

  res.setHeader('X-RateLimit-Limit', String(maxLimit));
  res.setHeader('X-RateLimit-Remaining', String(maxLimit - record.timestamps.length));

  next();
}

// ============================================================================
// 2. HTTP Security Headers Middleware (OWASP Standard)
// ============================================================================

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Basic XSS Protection for legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent flash / cross-domain policy files abuse
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Ensure express identity is hidden
  res.removeHeader('X-Powered-By');

  next();
}

// ============================================================================
// 3. Recursive Input Sanitization & Anti-Prototype-Pollution
// ============================================================================

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeValue(value: any, depth = 0): any {
  if (depth > 12) return value; // Prevent infinite recursion

  if (typeof value === 'string') {
    // Strip null byte injections
    return value.replace(/\0/g, '');
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(k)) {
        console.warn(`[Security Sanitizer] Blocked dangerous key injection attempt: "${k}"`);
        continue;
      }
      sanitizedObj[k] = sanitizeValue(v, depth + 1);
    }
    return sanitizedObj;
  }

  return value;
}

export function sanitizeInputMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  next();
}

// ============================================================================
// 4. Prompt Injection Defense Helper
// ============================================================================

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
  /system\s+prompt\s+override/i,
  /disregard\s+the\s+above/i,
  /DAN\s+mode\s+enabled/i,
];

export function sanitizePromptForAi(userPrompt: string): { safeText: string; hadInjectionAttempt: boolean } {
  if (!userPrompt || typeof userPrompt !== 'string') {
    return { safeText: '', hadInjectionAttempt: false };
  }

  let hadInjectionAttempt = false;
  let cleanText = userPrompt;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(cleanText)) {
      hadInjectionAttempt = true;
      console.warn(`[Security PromptGuard] Neutralized potential prompt injection pattern: "${pattern.source}"`);
      cleanText = cleanText.replace(pattern, '[Запрос нормализован системой безопасности]');
    }
  }

  return {
    safeText: cleanText,
    hadInjectionAttempt,
  };
}
