import { Body, Controller, HttpException, Post } from '@nestjs/common';

import { ReportRequestError } from './report-input.js';
import { ReportsService } from './reports.service.js';

@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  async create(@Body() body: unknown): Promise<{ submissionId: string; accepted: true }> {
    try {
      return await this.reports.accept(body);
    } catch (error) {
      if (error instanceof ReportRequestError) throw new HttpException(error.body, error.status);
      throw new HttpException({ code: 'report_unavailable', message: 'Unable to process report.' }, 500);
    }
  }
}
