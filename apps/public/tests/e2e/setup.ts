import { execFileSync } from 'node:child_process';
export default function setup() { execFileSync(process.execPath, ['../node_modules/tsx/dist/cli.mjs', 'tests/ui-fixture.ts'], { cwd: '../../backend', stdio: 'pipe', windowsHide: true }); }
