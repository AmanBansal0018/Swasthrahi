const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { platform } = require('node:os');

const root = join(__dirname, '..');
const requirements = join(root, 'requirements.txt');
const candidates = platform() === 'win32'
  ? [['py', ['-3']], ['python', []]]
  : [['python3', []], ['python', []]];

for (const [command, prefix] of candidates) {
  const probe = spawnSync(command, [...prefix, '--version'], { stdio: 'ignore' });
  if (probe.error || probe.status !== 0) continue;
  const result = spawnSync(command, [...prefix, '-m', 'pip', 'install', '-r', requirements], {
    cwd: root,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

console.error('Python 3 was not found. Install Python 3.10+ and ensure python (or py -3 on Windows) is on PATH, then run npm install again.');
process.exit(1);
