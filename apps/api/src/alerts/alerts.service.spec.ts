import { describe, expect, it } from 'vitest';

import { openingAlertContent, retryDelaySeconds } from './alerts.service.js';

describe('alert delivery policy', () => {
  it('renders an opening alert with only aggregate community data', () => {
    const content = openingAlertContent({ service: 'water', zoneName: 'Central' });

    expect(content).toContain('Water outage');
    expect(content).toContain('Central');
    expect(content).toContain('Community-generated, unofficial outage information.');
    expect(content).not.toMatch(/ana|device|token|latitude|longitude|timestamp/i);
  });

  it('increases retry delay while bounding it for recoverable attempts', () => {
    expect(retryDelaySeconds(1)).toBe(60);
    expect(retryDelaySeconds(2)).toBe(120);
    expect(retryDelaySeconds(20)).toBe(3600);
  });
});
