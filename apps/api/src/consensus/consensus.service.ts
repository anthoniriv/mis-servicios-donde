import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

import { AlertsService } from '../alerts/alerts.service.js';
import { episodeLifetimeHours, isQuorumThresholdCrossing, orderedLockKeys, quorumWindowMinutes, shouldRestoreEpisode } from './consensus-policy.js';

type Service = 'water' | 'electricity' | 'internet';
type Status = 'outage' | 'restored';
interface Vote { service: Service; eventId: string }
interface Episode { id: string; openedAt: Date; active: boolean }
interface Closure { closedAt: Date }

@Injectable()
export class ConsensusService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test' });

  constructor(private readonly alerts: AlertsService) {}

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }

  async evaluate(client: pg.PoolClient, zoneId: string, zoneName: string, h3Cell: string, status: Status, votes: Vote[]): Promise<void> {
    for (const key of orderedLockKeys(votes.map((vote) => [h3Cell, vote.service]))) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
    }
    for (const vote of votes) await this.evaluateVote(client, zoneId, zoneName, h3Cell, status, vote);
  }

  async listPublicEpisodes(): Promise<{ h3Cell: string; service: Service }[]> {
    const result = await this.pool.query<{ h3Cell: string; service: Service }>(
      'SELECT "h3Cell", "service" FROM "OutageEpisode" WHERE "active" = true AND "expiresAt" > CURRENT_TIMESTAMP',
    );
    return result.rows;
  }

  async expireStaleEpisodes(): Promise<void> {
    const candidates = await this.pool.query<{ h3Cell: string; service: Service }>(
      'SELECT "h3Cell", "service" FROM "OutageEpisode" WHERE "active" = true AND "expiresAt" <= CURRENT_TIMESTAMP',
    );
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const key of orderedLockKeys(candidates.rows.map((episode) => [episode.h3Cell, episode.service]))) {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
      }
      await client.query('UPDATE "OutageEpisode" SET "active" = false, "closedAt" = "expiresAt", "closureReason" = \'expired\'::"EpisodeClosureReason" WHERE "active" = true AND "expiresAt" <= CURRENT_TIMESTAMP');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  private async evaluateVote(client: pg.PoolClient, zoneId: string, zoneName: string, h3Cell: string, status: Status, vote: Vote): Promise<void> {
    await client.query('UPDATE "OutageEpisode" SET "active" = false, "closedAt" = "expiresAt", "closureReason" = \'expired\'::"EpisodeClosureReason" WHERE "h3Cell" = $1 AND "service" = $2::"Service" AND "active" = true AND "expiresAt" <= CURRENT_TIMESTAMP', [h3Cell, vote.service]);
    const active = await client.query<Episode>(
      'SELECT "id", "openedAt", "active" FROM "OutageEpisode" WHERE "h3Cell" = $1 AND "service" = $2::"Service" AND "active" = true FOR UPDATE',
      [h3Cell, vote.service],
    );
    const episode = active.rows[0];
    const closure = !episode && status === 'outage' ? await client.query<Closure>(
      'SELECT "closedAt" FROM "OutageEpisode" WHERE "h3Cell" = $1 AND "service" = $2::"Service" AND "closedAt" IS NOT NULL ORDER BY "closedAt" DESC LIMIT 1',
      [h3Cell, vote.service],
    ) : undefined;
    const voteWindowStart = status === 'restored' ? episode?.openedAt : closure?.rows[0]?.closedAt;
    const afterOpening = voteWindowStart ? ' AND "createdAt" > $5' : '';
    const parameters = voteWindowStart ? [h3Cell, vote.service, status, vote.eventId, voteWindowStart] : [h3Cell, vote.service, status, vote.eventId];
    const votes = await client.query<{ previous: string; current: string }>(
      `SELECT count(DISTINCT "deviceToken") FILTER (WHERE "id" <> $4) AS previous, count(DISTINCT "deviceToken") AS current FROM "ReportEvent" WHERE "h3Cell" = $1 AND "service" = $2::"Service" AND "status" = $3::"ReportStatus" AND "expiresAt" > CURRENT_TIMESTAMP AND "createdAt" > CURRENT_TIMESTAMP - INTERVAL '${quorumWindowMinutes} minutes'${afterOpening}`,
      parameters,
    );
    const counts = votes.rows[0];
    if (!counts || !isQuorumThresholdCrossing(Number(counts.previous), Number(counts.current))) return;
    if (status === 'restored') {
      if (episode && shouldRestoreEpisode({ active: episode.active, restoredVotesAfterOpening: Number(counts.current) })) {
        await client.query('UPDATE "OutageEpisode" SET "active" = false, "closedAt" = CURRENT_TIMESTAMP, "closureReason" = \'restored\'::"EpisodeClosureReason" WHERE "id" = $1', [episode.id]);
      }
      return;
    }
    if (episode) {
    await client.query(`UPDATE "OutageEpisode" SET "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '${episodeLifetimeHours} hours', "lastQuorumAt" = CURRENT_TIMESTAMP WHERE "id" = $1`, [episode.id]);
      return;
    }
    const created = await client.query<{ id: string }>(`INSERT INTO "OutageEpisode" ("zoneId", "h3Cell", "service", "expiresAt", "openedAt", "lastQuorumAt") VALUES ($1::uuid, $2, $3::"Service", CURRENT_TIMESTAMP + INTERVAL '${episodeLifetimeHours} hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING "id"`, [zoneId, h3Cell, vote.service]);
    if (created.rows[0]?.id) await this.alerts.queueOpening(client, created.rows[0].id, zoneName, vote.service);
  }
}
