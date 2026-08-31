import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { assertPurgeConfirmation } from './retention-policy.js';
import { RetentionService } from './retention.service.js';

assertPurgeConfirmation(process.env.CONFIRM_PILOT_PURGE);
const app = await NestFactory.createApplicationContext(AppModule);
try {
  await app.get(RetentionService).purgePilotData();
} finally {
  await app.close();
}
