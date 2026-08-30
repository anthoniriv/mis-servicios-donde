import { describe, expect, it } from 'vitest';

import { AppService } from './app.service.js';

describe('AppService', () => {
  it('returns the API health state', () => {
    expect(new AppService().getHealth()).toEqual({ status: 'ok' });
  });
});
