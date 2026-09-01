import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { createRateLimitMiddleware } from './rate-limit.js';

const JSON_BODY_LIMIT = '10kb';
const REQUEST_TIMEOUT_MS = 15_000;

/** Configure the first production HTTP hardening layer for the Express API. */
export function configureHttpSecurity(app: NestExpressApplication): void {
  app.use(helmet());

  const webOrigin = process.env.WEB_ORIGIN?.trim();
  if (webOrigin) app.enableCors({ origin: webOrigin });

  // Run the limiter before parsing request bodies so rejected requests do not
  // spend resources in JSON parsing. Its state is intentionally single-instance;
  // migrate it to Redis/Upstash before scaling the API horizontally.
  app.use(createRateLimitMiddleware());
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });

  const server = app.getHttpServer();
  server.setTimeout(REQUEST_TIMEOUT_MS);
  server.requestTimeout = REQUEST_TIMEOUT_MS;
}
