import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AlertsService, startAlertDispatchWorker } from './alerts/alerts.service.js';
import { AppModule } from './app.module.js';
import { ConsensusService, startEpisodeExpiryWorker } from './consensus/consensus.service.js';
import { resolveDatabaseUrl } from './database/database.pool.js';
import { RetentionService, startRetentionWorker } from './retention/retention.service.js';
import { configureHttpSecurity } from './security/http-security.js';

// The integration suite drops and recreates that schema on every run, so serving
// from it looks exactly like a broken pilot: gates pass, no zone matches, and every
// report comes back as the same generic refusal. An exported DATABASE_URL silently
// beats --env-file, which is how a shell from a previous session ends up here.
// Guards the resolved value, not the variable: a wrong built-in default is just as
// silent as a stale export, and the symptom is identical.
if (resolveDatabaseUrl().replace(/[?#].*$/, '').endsWith('_test')) {
  throw new Error(
    'DATABASE_URL points at the integration test database, which the test suite wipes. ' +
      'Unset it in this shell so .env applies, or point it at the development database.',
  );
}

const app = await NestFactory.create<NestExpressApplication>(AppModule);
configureHttpSecurity(app);
startAlertDispatchWorker(app.get(AlertsService));
startEpisodeExpiryWorker(app.get(ConsensusService));
if (process.env.RETENTION_WORKER_ENABLED === 'true') startRetentionWorker(app.get(RetentionService));
await app.listen(Number(process.env.PORT ?? 3000));
