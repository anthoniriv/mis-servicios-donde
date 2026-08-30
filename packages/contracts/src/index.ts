import { z } from 'zod';

export const serviceSchema = z.enum(['water', 'electricity', 'internet']);
export type Service = z.infer<typeof serviceSchema>;
