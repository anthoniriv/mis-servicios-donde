import { describe, expect, it } from 'vitest';

import { serviceSchema } from './index.js';

describe('service contract', () => {
  it('accepts a supported service', () => {
    expect(serviceSchema.parse('water')).toBe('water');
  });
});
