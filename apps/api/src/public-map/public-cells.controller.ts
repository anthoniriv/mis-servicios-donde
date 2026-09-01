import { Controller, Get, Query } from '@nestjs/common';

import { PublicCell, PublicCellsService } from './public-cells.service.js';

@Controller('v1/cells')
export class PublicCellsController {
  constructor(private readonly cells: PublicCellsService) {}

  @Get()
  async list(@Query('service') service?: string, @Query('provider') provider?: string): Promise<PublicCell[]> {
    return this.cells.listCells(service, provider);
  }
}
