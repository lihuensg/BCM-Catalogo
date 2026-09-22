import type { AdminIdentity } from '@bcm/shared';
export function adminIdentity(admin: {
    id: string;
    name: string;
    email: string;
}): AdminIdentity {
    return { id: admin.id, name: admin.name, email: admin.email };
}
