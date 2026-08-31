import { describe, expect, it } from 'vitest';

import { assertPurgeConfirmation } from './retention-policy.js';

describe('assertPurgeConfirmation', () => {
  it('allows only the explicit irreversible-purge confirmation', () => {
    expect(() => assertPurgeConfirmation('ERASE_PILOT_DATA')).not.toThrow();
  });

  it('rejects missing or incorrect confirmation values', () => {
    expect(() => assertPurgeConfirmation(undefined)).toThrow('ERASE_PILOT_DATA');
    expect(() => assertPurgeConfirmation('erase')).toThrow('ERASE_PILOT_DATA');
  });
});
