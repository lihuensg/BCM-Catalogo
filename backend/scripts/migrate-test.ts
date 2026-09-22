import './integration-env.js';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL ?? '' },
  stdio: 'inherit',
  windowsHide: true
});
process.exitCode = result.status ?? 1;
