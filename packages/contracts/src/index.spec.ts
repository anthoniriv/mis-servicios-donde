import { describe, expect, it } from 'vitest';

import { providerCatalog, providerSchema, reportInputSchema, reportStatusSchema, servicesSchema } from './index.js';

describe('report contracts', () => {
  it('accepts one to three distinct supported services', () => {
    expect(servicesSchema.parse(['water', 'internet'])).toEqual(['water', 'internet']);
    expect(() => servicesSchema.parse(['water', 'water'])).toThrow();
  });

  it('allows only outage lifecycle statuses', () => {
    expect(reportStatusSchema.parse('outage')).toBe('outage');
    expect(() => reportStatusSchema.parse('unknown')).toThrow();
  });

  it('exposes the Lima provider catalog and rejects service/provider mismatches', () => {
    expect(providerCatalog).toEqual({
      water: ['sedapal', 'other'],
      electricity: ['luz_del_sur', 'pluz', 'other'],
      internet: ['movistar', 'claro', 'win', 'wow', 'mifibra', 'other'],
    });
    expect(providerSchema.parse('pluz')).toBe('pluz');

    const valid = {
      submissionId: 'submission-001', deviceId: 'device-001', services: ['water', 'internet'],
      providers: { water: 'sedapal', internet: 'win' }, status: 'outage', latitude: -12, longitude: -77,
    };
    expect(reportInputSchema.parse(valid).providers).toEqual(valid.providers);
    expect(() => reportInputSchema.parse({ ...valid, providers: { water: 'pluz', internet: 'win' } })).toThrow();
    expect(() => reportInputSchema.parse({ ...valid, services: ['water'], providers: { water: 'sedapal', internet: 'win' } })).toThrow();
    expect(() => reportInputSchema.parse({ ...valid, providers: { internet: 'win' } })).toThrow();
  });
});
