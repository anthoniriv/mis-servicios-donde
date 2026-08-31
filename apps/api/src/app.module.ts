import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AlertsService } from './alerts/alerts.service.js';
import { ConsensusService } from './consensus/consensus.service.js';
import { PublicCellsController } from './public-map/public-cells.controller.js';
import { PublicCellsService } from './public-map/public-cells.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ReportsService } from './reports/reports.service.js';

@Module({
  controllers: [AppController, ReportsController, PublicCellsController],
  providers: [AppService, ReportsService, ConsensusService, PublicCellsService, AlertsService],
})
export class AppModule {}
