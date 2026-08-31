import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

interface ZoneRow { name: string }

export interface PrintableNotice {
  title: string;
  zone: string;
  instructions: string;
  mapUrl: string;
  notice: string;
}

export function printableNotice(input: { name: string }): PrintableNotice {
  return {
    title: `${input.name} community outage notice`,
    zone: input.name,
    instructions: 'Report water, electricity, or internet outages on the community map.',
    mapUrl: '/',
    notice: 'Community-generated, unofficial outage information.',
  };
}

@Injectable()
export class NoticesService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test' });

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }

  async forApprovedZone(slug: string): Promise<PrintableNotice> {
    const zone = await this.pool.query<ZoneRow>('SELECT "name" FROM "PilotZone" WHERE "slug" = $1 AND "approved" = true', [slug]);
    if (!zone.rows[0]) throw new NotFoundException();
    return printableNotice(zone.rows[0]);
  }
}
