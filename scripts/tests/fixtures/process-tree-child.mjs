import { spawn } from 'node:child_process';
import process from 'node:process';
import { resolve } from 'node:path';

const grandchildScriptPath = resolve(
  process.cwd(),
  'scripts',
  'tests',
  'fixtures',
  'process-tree-grandchild.mjs',
);

const grandchild = spawn(process.execPath, [grandchildScriptPath], {
  detached: false,
  stdio: 'ignore',
});

process.stdout.write(`${grandchild.pid}\n`);
setInterval(() => {}, 1_000);
