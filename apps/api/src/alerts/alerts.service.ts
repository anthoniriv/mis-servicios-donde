import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

type Service = 'water' | 'electricity' | 'internet';
interface ClaimedIntent { id: string; content: string; attempts: number; leaseToken: string }

const unofficialLabel = 'Community-generated, unofficial outage information.';

export function openingAlertContent(input: { service: Service; zoneName: string }): string {
  return `${input.service.charAt(0).toUpperCase()}${input.service.slice(1)} outage in ${input.zoneName}. ${unofficialLabel}`;
}

export function retryDelaySeconds(attempts: number): number {
  return Math.min(60 * 2 ** Math.max(attempts - 1, 0), 3600);
}

@Injectable()
export class AlertsService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? 'postgresql://mis_servicios:mis_servicios@127.0.0.1:54329/mis_servicios_test' });

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }

  async queueOpening(client: pg.PoolClient, episodeId: string, zoneName: string, service: Service): Promise<void> {
    await client.query(
      `INSERT INTO "AlertIntent" ("episodeId", "kind", "content") VALUES ($1::uuid, 'OPENED', $2) ON CONFLICT ("episodeId", "kind") DO NOTHING`,
      [episodeId, openingAlertContent({ zoneName, service })],
    );
  }

  async dispatchPending(): Promise<void> {
    if (process.env.ALERT_DISPATCH_ENABLED !== 'true') {
      await this.pool.query(`UPDATE "AlertIntent" SET "status" = 'cancelled', "cancelledAt" = CURRENT_TIMESTAMP WHERE "status" IN ('pending', 'retryable')`);
      return;
    }
    for (const intent of await this.claimPending()) await this.deliver(intent);
  }

  private async claimPending(): Promise<ClaimedIntent[]> {
    const leaseToken = crypto.randomUUID();
    const result = await this.pool.query<ClaimedIntent>(
      `WITH candidates AS (
        SELECT "id" FROM "AlertIntent" WHERE "status" IN ('pending', 'retryable') AND "nextAttemptAt" <= CURRENT_TIMESTAMP
          AND ("leaseExpiresAt" IS NULL OR "leaseExpiresAt" < CURRENT_TIMESTAMP) ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 10
      ) UPDATE "AlertIntent" intent SET "leaseToken" = $1, "leaseExpiresAt" = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
      FROM candidates WHERE intent."id" = candidates."id" RETURNING intent."id", intent."content", intent."attempts", intent."leaseToken"`, [leaseToken],
    );
    return result.rows.filter((intent): intent is ClaimedIntent => intent.leaseToken !== null);
  }

  private async deliver(intent: ClaimedIntent): Promise<void> {
    try {
      await this.sendTelegram(intent.content);
      await this.pool.query(`UPDATE "AlertIntent" SET "status" = 'delivered', "deliveredAt" = CURRENT_TIMESTAMP, "leaseToken" = NULL, "leaseExpiresAt" = NULL WHERE "id" = $1::uuid AND "leaseToken" = $2`, [intent.id, intent.leaseToken]);
    } catch {
      const attempts = intent.attempts + 1;
      await this.pool.query(`UPDATE "AlertIntent" SET "status" = 'retryable', "attempts" = $3, "nextAttemptAt" = CURRENT_TIMESTAMP + ($4 * INTERVAL '1 second'), "leaseToken" = NULL, "leaseExpiresAt" = NULL WHERE "id" = $1::uuid AND "leaseToken" = $2`, [intent.id, intent.leaseToken, attempts, retryDelaySeconds(attempts)]);
    }
  }

  private async sendTelegram(content: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error('Telegram is not configured.');
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: content }) });
    if (!response.ok) throw new Error('Telegram rejected the alert.');
  }
}
