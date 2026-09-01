import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AlertsService } from './alerts/alerts.service.js';
import { DatabasePool } from './database/database.pool.js';
import { ConsensusService } from './consensus/consensus.service.js';
import { NoticesController } from './notices/notices.controller.js';
import { NoticesService } from './notices/notices.service.js';
import { PublicCellsController } from './public-map/public-cells.controller.js';
import { PublicCellsService } from './public-map/public-cells.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ReportsService } from './reports/reports.service.js';
import { RetentionService } from './retention/retention.service.js';

@Module({
  controllers: [AppController, ReportsController, PublicCellsController, NoticesController],
  providers: [DatabasePool, AppService, ReportsService, ConsensusService, PublicCellsService, AlertsService, NoticesService, RetentionService],
})
export class AppModule {}
