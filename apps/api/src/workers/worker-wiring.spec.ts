import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AlertsService, startAlertDispatchWorker } from '../alerts/alerts.service.js';
import { type ConsensusService, startEpisodeExpiryWorker } from '../consensus/consensus.service.js';
import { millisecondsUntilNextLimaMidnight, type RetentionService, startRetentionWorker } from '../retention/retention.service.js';

describe('worker wiring', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('drives alert dispatch so opening intents leave the outbox', async () => {
    const dispatchPending = vi.fn().mockResolvedValue(undefined);

    const worker = startAlertDispatchWorker({ dispatchPending } as unknown as AlertsService);
    await vi.advanceTimersByTimeAsync(0);

    expect(dispatchPending).toHaveBeenCalledTimes(1);
    worker.stop();
  });

  it('drives episode expiry so elapsed outages stop being active', async () => {
    const expireStaleEpisodes = vi.fn().mockResolvedValue(undefined);

    const worker = startEpisodeExpiryWorker({ expireStaleEpisodes } as unknown as ConsensusService);
    await vi.advanceTimersByTimeAsync(0);

    expect(expireStaleEpisodes).toHaveBeenCalledTimes(1);
    worker.stop();
  });

  it('calculates the delay to the next midnight in Lima', () => {
    expect(millisecondsUntilNextLimaMidnight(new Date('2026-08-31T04:00:00.000Z'))).toBe(60 * 60 * 1000);
    expect(millisecondsUntilNextLimaMidnight(new Date('2026-08-31T05:00:00.000Z'))).toBe(24 * 60 * 60 * 1000);
  });

  it('starts retention cleanup at the next Lima midnight and repeats daily', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);

    const worker = startRetentionWorker({ cleanup } as unknown as RetentionService, new Date('2026-08-31T04:00:00.000Z'));
    await vi.advanceTimersByTimeAsync(0);

    expect(cleanup).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(cleanup).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(cleanup).toHaveBeenCalledTimes(2);
    worker.stop();
  });

  it('keeps dispatching after a provider outage instead of dying', async () => {
    const dispatchPending = vi.fn().mockRejectedValueOnce(new Error('telegram down')).mockResolvedValue(undefined);

    const worker = startAlertDispatchWorker({ dispatchPending } as unknown as AlertsService);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(dispatchPending.mock.calls.length).toBeGreaterThan(1);
    worker.stop();
  });
});
