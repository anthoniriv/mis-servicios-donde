import { z } from 'zod';

export const serviceSchema = z.enum(['water', 'electricity', 'internet']);
export const servicesSchema = z.array(serviceSchema).min(1).max(3).refine(
  (services) => new Set(services).size === services.length,
  'Services must be distinct',
);
export const reportStatusSchema = z.enum(['outage', 'restored']);
export type Service = z.infer<typeof serviceSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
