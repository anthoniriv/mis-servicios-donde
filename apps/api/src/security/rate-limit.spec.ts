import { describe, expect, it } from 'vitest';

import {
  createRateLimitMiddleware,
  MemoryRateLimiter,
  type HttpRequest,
  type HttpResponse,
  type RateLimitConfig,
} from './rate-limit.js';

class TestResponse implements HttpResponse {
  readonly headers: Record<string, string> = {};
  statusCode?: number;
  body?: unknown;

  setHeader(name: string, value: string): void { this.headers[name] = value; }
  status(code: number): this { this.statusCode = code; return this; }
  json(body: unknown): unknown { this.body = body; return body; }
}

function response(): TestResponse {
  return new TestResponse();
}

const config: RateLimitConfig = {
  global: { maxRequests: 100, windowMs: 1_000 },
  reports: { maxRequests: 2, windowMs: 10_000 },
  maxKeys: 2,
};

describe('MemoryRateLimiter', () => {
  it('blocks inside a fixed window and allows the next window', () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter({ maxRequests: 2, windowMs: 1_000 }, 10, () => now);

    expect(limiter.check('ip-1').allowed).toBe(true);
    expect(limiter.check('ip-1').allowed).toBe(true);
    expect(limiter.check('ip-1')).toMatchObject({ allowed: false, retryAfterSeconds: 1 });

    now = 2_000;
    expect(limiter.check('ip-1').allowed).toBe(true);
  });

  it('prunes expired keys before admitting new keys', () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter({ maxRequests: 1, windowMs: 1_000 }, 2, () => now);

    limiter.check('expired');
    now = 2_000;
    limiter.check('fresh');

    expect(limiter.size).toBe(1);
  });

  it('keeps key storage bounded when callers rotate IPs', () => {
    const limiter = new MemoryRateLimiter({ maxRequests: 10, windowMs: 10_000 }, 2, () => 1_000);

    limiter.check('ip-1');
    limiter.check('ip-2');
    limiter.check('ip-3');

    expect(limiter.size).toBe(2);
  });
});

describe('report rate-limit middleware', () => {
  it('applies the stricter limit only to POST /v1/reports and returns Retry-After', () => {
    let now = 1_000;
    const middleware = createRateLimitMiddleware(config, () => now);
    const request: HttpRequest = { method: 'POST', path: '/v1/reports', ip: '192.0.2.10' };
    let nextCalls = 0;

    middleware(request, response(), () => { nextCalls += 1; });
    middleware(request, response(), () => { nextCalls += 1; });
    const rejected = response();
    middleware(request, rejected, () => { nextCalls += 1; });

    expect(nextCalls).toBe(2);
    expect(rejected.statusCode).toBe(429);
    expect(rejected.headers['Retry-After']).toBe('10');
    expect(rejected.body).toEqual({ code: 'rate_limited', message: 'Too many requests.' });

    const nonReport = response();
    middleware({ method: 'GET', path: '/v1/cells', ip: request.ip }, nonReport, () => { nextCalls += 1; });
    expect(nonReport.statusCode).toBeUndefined();
    expect(nextCalls).toBe(3);

    now = 11_000;
    expect(() => middleware(request, response(), () => { nextCalls += 1; })).not.toThrow();
    expect(nextCalls).toBe(4);
  });
});
