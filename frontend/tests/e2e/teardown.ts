import { execFileSync } from 'node:child_process';
export default function teardown() { execFileSync(process.execPath, ['../node_modules/tsx/dist/cli.mjs', 'tests/ui-fixture.ts', 'cleanup'], { cwd: '../backend', stdio: 'pipe', windowsHide: true }); }
