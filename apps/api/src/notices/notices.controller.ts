import { Controller, Get, Param } from '@nestjs/common';

import { NoticesService, PrintableNotice } from './notices.service.js';

@Controller('v1/zones')
export class NoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Get(':slug/notice')
  async printable(@Param('slug') slug: string): Promise<PrintableNotice> {
    return this.notices.forApprovedZone(slug);
  }
}
