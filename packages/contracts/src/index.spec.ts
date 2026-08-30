import { describe, expect, it } from 'vitest';

import { reportStatusSchema, servicesSchema } from './index.js';

describe('report contracts', () => {
  it('accepts one to three distinct supported services', () => {
    expect(servicesSchema.parse(['water', 'internet'])).toEqual(['water', 'internet']);
    expect(() => servicesSchema.parse(['water', 'water'])).toThrow();
  });

  it('allows only outage lifecycle statuses', () => {
    expect(reportStatusSchema.parse('outage')).toBe('outage');
    expect(() => reportStatusSchema.parse('unknown')).toThrow();
  });
});
