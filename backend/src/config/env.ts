import { z } from 'zod';
const originSchema = z.string().url().refine((value) => {
    if (!URL.canParse(value))
        return false;
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Use an HTTP(S) origin without a path or trailing slash');
const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(604800).default(28800),
    HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4100),
    CORS_ORIGINS: z.string().default('').transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)).pipe(z.array(originSchema)),
    FRONTEND_REVALIDATE_URL: z.string().url().optional(),
    REVALIDATION_SECRET: z.string().min(32).optional()
}).superRefine((value, context) => {
    const configured = Boolean(value.FRONTEND_REVALIDATE_URL);
    const secret = Boolean(value.REVALIDATION_SECRET);
    if (configured !== secret) {
        context.addIssue({ code: 'custom', path: ['REVALIDATION_SECRET'], message: 'Revalidation URL and secret must be configured together' });
    }
});
export function parseEnvironment(source: NodeJS.ProcessEnv) {
    const result = environmentSchema.safeParse(source);
    if (!result.success) {
        const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
        throw new Error(`Invalid environment fields: ${fields.join(', ')}`);
    }
    return result.data;
}
