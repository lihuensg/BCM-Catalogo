/** Validate without printing connection strings or credentials. */
export function requireDatabaseUrl(value: string | undefined, name = 'DATABASE_URL'): string {
    if (!value || !URL.canParse(value))
        throw new Error(`${name} must be configured with a PostgreSQL URL`);
    const url = new URL(value);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
        throw new Error(`${name} must be configured with a PostgreSQL URL`);
    }
    return value;
}
