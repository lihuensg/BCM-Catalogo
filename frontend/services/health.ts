import 'server-only';
import type { ApiSuccess, HealthStatus } from '@bcm/shared';

/** Operational diagnostic only. Never make the public shell depend on liveness. */
export async function fetchHealth(): Promise<ApiSuccess<HealthStatus>> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL is required for API diagnostics');
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Health request failed');
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('data' in body) || typeof body.data !== 'object' || body.data === null || !('status' in body.data) || body.data.status !== 'ok') {
    throw new Error('Invalid health response');
  }
  return { data: { status: body.data.status }, meta: {} };
}
