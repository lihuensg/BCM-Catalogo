type LogEvent = 'auth.login.failed' | 'auth.login.succeeded' | 'auth.logout' | 'admin.mutation' | 'internal.error';
/** Only fixed event names and server-generated identity/status; never request bodies or errors. */
export function logEvent(event: LogEvent, context: {
    adminId?: string;
    status?: number;
    requestId?: string;
} = {}) {
    console.info(JSON.stringify({ event, ...context, at: new Date().toISOString() }));
}
