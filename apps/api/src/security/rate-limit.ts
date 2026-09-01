type Environment = Record<string, string | undefined>;

export interface RateLimitPolicy {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitConfig {
  global: RateLimitPolicy;
  reports: RateLimitPolicy;
  maxKeys: number;
}

interface Bucket {
  count: number;
  resetAt: number;
  lastSeenAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface HttpRequest {
  method: string;
  path?: string;
  url?: string;
  ip?: string;
  socket?: { remoteAddress?: string };
}

export interface HttpResponse {
  setHeader(name: string, value: string): void;
  status(code: number): this;
  json(body: unknown): unknown;
}

export type Next = () => void;

const DEFAULT_GLOBAL_POLICY: RateLimitPolicy = { maxRequests: 120, windowMs: 60_000 };
const DEFAULT_REPORT_POLICY: RateLimitPolicy = { maxRequests: 5, windowMs: 3_600_000 };
const DEFAULT_MAX_KEYS = 10_000;

/**
 * Fixed-window limiter with explicit memory bounds. Expired buckets are pruned
 * on every check, and the oldest bucket is evicted before a new key can exceed
 * maxKeys. This is protection for a single API instance only; when the API is
 * scaled, migrate this state to Redis/Upstash for shared limits.
 */
export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly policy: RateLimitPolicy,
    private readonly maxKeys: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const currentTime = this.now();
    this.pruneExpired(currentTime);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= currentTime) {
      if (!bucket) this.ensureCapacity();
      bucket = { count: 0, resetAt: currentTime + this.policy.windowMs, lastSeenAt: currentTime };
      this.buckets.set(key, bucket);
    }

    if (bucket.count >= this.policy.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1_000)),
      };
    }

    bucket.count += 1;
    bucket.lastSeenAt = currentTime;
    return { allowed: true };
  }

  get size(): number {
    return this.buckets.size;
  }

  private pruneExpired(currentTime: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= currentTime) this.buckets.delete(key);
    }
  }

  private ensureCapacity(): void {
    while (this.buckets.size >= this.maxKeys) {
      const oldestKey = this.findOldestKey();
      if (oldestKey === undefined) return;
      this.buckets.delete(oldestKey);
    }
  }

  private findOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Number.POSITIVE_INFINITY;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastSeenAt < oldestTime) {
        oldestKey = key;
        oldestTime = bucket.lastSeenAt;
      }
    }
    return oldestKey;
  }
}

export function rateLimitConfigFromEnv(environment: Environment = process.env): RateLimitConfig {
  return {
    global: {
      maxRequests: readPositiveInteger(environment.RATE_LIMIT_MAX, DEFAULT_GLOBAL_POLICY.maxRequests),
      windowMs: readPositiveInteger(environment.RATE_LIMIT_WINDOW_MS, DEFAULT_GLOBAL_POLICY.windowMs),
    },
    reports: {
      maxRequests: readPositiveInteger(environment.REPORT_RATE_LIMIT_MAX, DEFAULT_REPORT_POLICY.maxRequests),
      windowMs: readPositiveInteger(environment.REPORT_RATE_LIMIT_WINDOW_MS, DEFAULT_REPORT_POLICY.windowMs),
    },
    maxKeys: readPositiveInteger(environment.RATE_LIMIT_MAX_KEYS, DEFAULT_MAX_KEYS),
  };
}

export function createRateLimitMiddleware(
  config: RateLimitConfig = rateLimitConfigFromEnv(),
  now: () => number = Date.now,
): (request: HttpRequest, response: HttpResponse, next: Next) => void {
  const globalLimiter = new MemoryRateLimiter(config.global, config.maxKeys, now);
  const reportLimiter = new MemoryRateLimiter(config.reports, config.maxKeys, now);

  return (request, response, next) => {
    const key = request.ip?.trim() || request.socket?.remoteAddress || 'unknown';
    const checks = [globalLimiter.check(key)];
    if (isReportSubmission(request)) checks.push(reportLimiter.check(key));

    const rejected = checks.find((result) => !result.allowed);
    if (!rejected) {
      next();
      return;
    }

    response.setHeader('Retry-After', String(rejected.retryAfterSeconds ?? 1));
    response.status(429).json({ code: 'rate_limited', message: 'Too many requests.' });
  };
}

function isReportSubmission(request: HttpRequest): boolean {
  if (request.method.toUpperCase() !== 'POST') return false;
  const pathname = request.path ?? request.url?.split('?')[0];
  return pathname?.replace(/\/+$/, '') === '/v1/reports';
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
