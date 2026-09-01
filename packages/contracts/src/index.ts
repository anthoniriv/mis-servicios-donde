import { z } from 'zod';

export const serviceSchema = z.enum(['water', 'electricity', 'internet']);
export const servicesSchema = z.array(serviceSchema).min(1).max(3).refine(
  (services) => new Set(services).size === services.length,
  'Services must be distinct',
);
export const reportStatusSchema = z.enum(['outage', 'restored']);
export type Service = z.infer<typeof serviceSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const providerCatalog = {
  water: ['sedapal', 'other'],
  electricity: ['luz_del_sur', 'pluz', 'other'],
  internet: ['movistar', 'claro', 'win', 'wow', 'mifibra', 'other'],
} as const satisfies Record<Service, readonly string[]>;

const providerValues = ['sedapal', 'luz_del_sur', 'pluz', 'movistar', 'claro', 'win', 'wow', 'mifibra', 'other'] as const;
export const providerSchema = z.enum(providerValues);
export type Provider = z.infer<typeof providerSchema>;

export const providersSchema = z.object({
  water: providerSchema.optional(),
  electricity: providerSchema.optional(),
  internet: providerSchema.optional(),
});

/**
 * The whole accepted report shape. Unknown keys are stripped rather than
 * rejected, so the API never holds a field a client volunteered.
 */
export const reportInputSchema = z.object({
  submissionId: z.string().trim().min(1),
  deviceId: z.string().trim().min(1),
  services: servicesSchema,
  providers: providersSchema,
  status: reportStatusSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
}).superRefine((input, context) => {
  for (const service of input.services) {
    const provider = input.providers[service];
    if (!provider) {
      context.addIssue({ code: 'custom', path: ['providers', service], message: 'A provider is required for every selected service' });
      continue;
    }
    if (!(providerCatalog[service] as readonly string[]).includes(provider)) {
      context.addIssue({ code: 'custom', path: ['providers', service], message: 'Provider is not supported for the selected service' });
    }
  }

  for (const service of serviceSchema.options) {
    if (input.providers[service] && !input.services.includes(service)) {
      context.addIssue({ code: 'custom', path: ['providers', service], message: 'Provider was supplied for an unselected service' });
    }
  }
});

export type ReportInput = z.infer<typeof reportInputSchema>;
