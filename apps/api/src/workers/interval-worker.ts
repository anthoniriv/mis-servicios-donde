export interface ScheduledWorker {
  stop: () => void;
}

/**
 * Re-arms only after the previous cycle settles, so a cycle slower than the
 * interval never overlaps itself, and a failing cycle is retried on the next
 * tick instead of ending the worker.
 */
export function startIntervalWorker(run: () => Promise<unknown>, intervalMs: number): ScheduledWorker {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const cycle = async (): Promise<void> => {
    try {
      await run();
    } catch {
      // Swallowed on purpose: the next tick retries.
    }
    if (stopped) return;
    timer = setTimeout(() => void cycle(), intervalMs);
    timer.unref();
  };

  void cycle();

  return {
    stop: (): void => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export function configuredIntervalMs(name: string, fallbackSeconds: number): number {
  const seconds = Number(process.env[name] ?? fallbackSeconds);
  return (Number.isInteger(seconds) && seconds > 0 ? seconds : fallbackSeconds) * 1000;
}
