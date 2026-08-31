import { sanitizeDisplayName } from '../trust/trust.service.js';

const supportedServices = new Set(['water', 'electricity', 'internet']);
const supportedStatuses = new Set(['outage', 'restored']);

export type ReportServiceName = 'water' | 'electricity' | 'internet';
export type ReportStatus = 'outage' | 'restored';

export interface ReportInput {
  submissionId: string;
  deviceId: string;
  services: ReportServiceName[];
  status: ReportStatus;
  latitude: number;
  longitude: number;
  name?: string;
}

export class ReportRequestError extends Error {
  constructor(public readonly status: 400 | 409, public readonly body: { code: string; message: string }) {
    super(body.message);
  }
}

export function validateReportInput(value: unknown): ReportInput {
  if (!isRecord(value)) throw unavailable();
  const { submissionId, deviceId, services, status, latitude, longitude, name } = value;
  if (typeof submissionId !== 'string' || !submissionId.trim() || typeof deviceId !== 'string' || !deviceId.trim()) throw unavailable();
  if (!Array.isArray(services) || services.length < 1 || services.length > 3 || !services.every((service) => typeof service === 'string' && supportedServices.has(service))) throw unavailable();
  if (new Set(services).size !== services.length || typeof status !== 'string' || !supportedStatuses.has(status)) throw unavailable();
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw unavailable();
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw unavailable();
  if (name !== undefined && typeof name !== 'string') throw unavailable();
  return { submissionId: submissionId.trim(), deviceId: deviceId.trim(), services: services as ReportServiceName[], status: status as ReportStatus, latitude, longitude, name: sanitizeDisplayName(name) };
}

export function unavailable(): ReportRequestError {
  return new ReportRequestError(400, { code: 'report_unavailable', message: 'Unable to process report.' });
}

export function conflict(): ReportRequestError {
  return new ReportRequestError(409, { code: 'submission_conflict', message: 'Submission identifier conflicts with prior input.' });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
