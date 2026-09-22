import type { HealthStatus } from '@bcm/shared';
export function getHealth(): HealthStatus {
    return { status: 'ok' };
}
