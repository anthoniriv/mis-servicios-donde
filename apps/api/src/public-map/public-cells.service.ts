import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const publicServices = new Set(['water', 'electricity', 'internet']);

export interface PublicCell {
  h3Cell: string;
  service: 'water' | 'electricity' | 'internet';
}

@Injectable()
export class PublicCellsService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test' });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async listCells(service?: unknown): Promise<PublicCell[]> {
    if (!isSupportedService(service) || !(await this.isPublicationEnabled())) return [];

    const values = service ? [service] : [];
    const filter = service ? ' AND "service" = $1::"Service"' : '';
    const result = await this.pool.query<PublicCell>(
      `SELECT episode."h3Cell", episode."service" FROM "OutageEpisode" AS episode INNER JOIN "PilotZone" AS zone ON zone."id" = episode."zoneId" WHERE episode."active" = true AND episode."expiresAt" > CURRENT_TIMESTAMP AND zone."approved" = true${filter}`,
      values,
    );
    return result.rows;
  }

  private async isPublicationEnabled(): Promise<boolean> {
    if (process.env.PUBLIC_MAP_ENABLED !== 'true' || !hasConfiguredH3Resolution()) return false;
    const zones = await this.pool.query<{ count: string }>('SELECT count(*) FROM "PilotZone" WHERE "approved" = true');
    const count = Number(zones.rows[0]?.count ?? 0);
    return count === 2 || count === 3;
  }
}

function isSupportedService(service: unknown): service is PublicCell['service'] | undefined {
  return service === undefined || (typeof service === 'string' && publicServices.has(service));
}

function hasConfiguredH3Resolution(): boolean {
  const resolution = Number(process.env.H3_RESOLUTION ?? 9);
  return Number.isInteger(resolution) && resolution >= 0 && resolution <= 15;
}
