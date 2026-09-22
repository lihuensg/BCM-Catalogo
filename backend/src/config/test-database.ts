import { requireDatabaseUrl } from './database.js';
/** Test-only mode requires explicit configuration and no development connection. */
export function assertSeparateTestDatabase(development: string | undefined, testing: string | undefined, testOnly = false) {
    const test = new URL(requireDatabaseUrl(testing, 'TEST_DATABASE_URL'));
    if (!development?.trim() && testOnly)
        return;
    const dev = new URL(requireDatabaseUrl(development, 'DATABASE_URL'));
    const identity = (url: URL) => {
        let host = url.hostname.toLowerCase();
        if (host.endsWith('.neon.tech'))
            host = host.replace('-pooler.', '.');
        if (['localhost', '127.0.0.1', '[::1]'].includes(host))
            host = 'loopback';
        return JSON.stringify([host, url.port || '5432', decodeURIComponent(url.pathname)]);
    };
    if (identity(dev) === identity(test)) {
        throw new Error('Integration aborted: development and test must use separate databases, not different connection options or schemas.');
    }
}
