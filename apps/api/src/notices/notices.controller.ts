import { Controller, Get, Param } from '@nestjs/common';

import { NoticesService, PrintableNotice, ZoneSummary } from './notices.service.js';

@Controller('v1/zones')
export class NoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Get()
  async list(): Promise<ZoneSummary[]> {
    return this.notices.listApprovedZones();
  }

  @Get(':slug/notice')
  async printable(@Param('slug') slug: string): Promise<PrintableNotice> {
    return this.notices.forApprovedZone(slug);
  }
}
