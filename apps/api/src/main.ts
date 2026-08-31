import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { RetentionService, startRetentionWorker } from './retention/retention.service.js';

const app = await NestFactory.create(AppModule);
if (process.env.RETENTION_WORKER_ENABLED === 'true') startRetentionWorker(app.get(RetentionService));
await app.listen(Number(process.env.PORT ?? 3000));
