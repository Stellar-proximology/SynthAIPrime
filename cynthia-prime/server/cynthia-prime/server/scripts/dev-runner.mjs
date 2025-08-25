import { spawn } from 'node:child_process';

const procs = [];

function run(cmd, args, name) {
  const p = spawn(cmd, args, { stdio: 'inherit' });
  p.on('exit', (code) => {
    console.log(`[${name}] exited with ${code}`);
    process.exit(code ?? 0);
  });
  procs.push(p);
}

run('node', ['--loader','ts-node/esm','server/main.ts'], 'api');

setTimeout(() => {
  run('vite', ['--config','client/vite.config.ts'], 'vite');
}, 800);

process.on('SIGINT', () => procs.forEach(p => p.kill('SIGINT')));
process.on('SIGTERM', () => procs.forEach(p => p.kill('SIGTERM')));
