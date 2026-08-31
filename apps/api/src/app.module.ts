import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConsensusService } from './consensus/consensus.service.js';
import { ReportsController } from './reports/reports.controller.js';
import { ReportsService } from './reports/reports.service.js';

@Module({
  controllers: [AppController, ReportsController],
  providers: [AppService, ReportsService, ConsensusService],
})
export class AppModule {}
