// Rate Limiting Middleware
// In-memory rate limiting for API routes

import { NextRequest } from 'next/server';
import { RateLimitError } from '../errors';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  max: number; // Max requests
  window: number; // Time window in seconds
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  default: { max: 100, window: 60 }, // 100 requests per minute
  auth: { max: 10, window: 60 }, // 10 requests per minute
  form: { max: 50, window: 60 }, // 50 requests per minute
  implementation: { max: 20, window: 60 }, // 20 requests per minute
  health: { max: 200, window: 60 }, // 200 requests per minute
} as const;

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.default
): Promise<void> {
  const identifier = getIdentifier(request);
  const key = `${identifier}:${config.max}:${config.window}`;
  const now = Date.now();
  const windowMs = config.window * 1000;

  // Get or create rate limit entry
  let entry = store[key];

  if (!entry || entry.resetAt < now) {
    // Create new entry
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store[key] = entry;
    return;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(retryAfter);
  }
}

/**
 * Get unique identifier for rate limiting
 * Uses IP address or Authorization header
 */
function getIdentifier(request: NextRequest): string {
  // Use auth token if available for authenticated requests
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return `auth:${authHeader.substring(0, 20)}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Get remaining rate limit info
 */
export function getRateLimitInfo(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.default
): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const identifier = getIdentifier(request);
  const key = `${identifier}:${config.max}:${config.window}`;
  const now = Date.now();

  const entry = store[key];

  if (!entry || entry.resetAt < now) {
    return {
      limit: config.max,
      remaining: config.max,
      reset: now + config.window * 1000,
    };
  }

  return {
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    reset: entry.resetAt,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  info: ReturnType<typeof getRateLimitInfo>
): void {
  headers.set('X-RateLimit-Limit', info.limit.toString());
  headers.set('X-RateLimit-Remaining', info.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(info.reset / 1000).toString());
}
