const { spawn } = require('node:child_process');
const { join } = require('node:path');
const { platform } = require('node:os');

const root = join(__dirname, '..');
const isWindows = platform() === 'win32';
const python = process.env.PYTHON || (isWindows ? 'py' : 'python3');
const pythonArgs = isWindows && python === 'py' ? ['-3'] : [];
const reload = process.argv.includes('--reload');
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || '8000';
const args = [...pythonArgs, '-m', 'uvicorn', 'backend.main:app', '--host', host, '--port', port];
if (reload) args.push('--reload');

const child = spawn(python, args, { cwd: root, stdio: 'inherit', env: process.env });
child.on('error', (error) => {
  console.error(`Could not start Python (${python}). Run npm install first and check that Python 3 is installed.`, error.message);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
