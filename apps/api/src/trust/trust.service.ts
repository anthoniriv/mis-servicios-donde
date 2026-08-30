import { createHash, createHmac } from 'node:crypto';

export interface EligibilityInput {
  submittedAt: Date;
  priorSubmissionTimes: Date[];
}

export interface EligibilityResult {
  eligible: boolean;
  internalReason?: 'rate_limit';
}

export function createVersionedDeviceToken(deviceId: string, secret: string, version: string): string {
  return `${version}:${createHmac('sha256', secret).update(deviceId).digest('hex')}`;
}

export function canonicalSubmissionHash(input: {
  h3Cell: string;
  services: string[];
  status: string;
}): string {
  return createHash('sha256')
    .update(JSON.stringify({ ...input, services: [...input.services].sort() }))
    .digest('hex');
}

export function sanitizeDisplayName(value?: string): string | undefined {
  const sanitized = value?.replace(/[^\p{L}\p{N}' -]/gu, '').replace(/\s+/gu, ' ').trim().slice(0, 80);
  return sanitized || undefined;
}

export function assessSubmissionEligibility(input: EligibilityInput): EligibilityResult {
  const oneHourAgo = input.submittedAt.getTime() - 60 * 60 * 1000;
  const recentCount = input.priorSubmissionTimes.filter((time) => time.getTime() > oneHourAgo).length;
  return recentCount >= 3 ? { eligible: false, internalReason: 'rate_limit' } : { eligible: true };
}

export function toPublicTrustOutcome(result: EligibilityResult): { accepted: true } {
  void result;
  return { accepted: true };
}

export function toSafeError(details: Record<string, unknown>): { code: 'report_unavailable'; message: string } {
  void details;
  return { code: 'report_unavailable', message: 'Unable to process report.' };
}
