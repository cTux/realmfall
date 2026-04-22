import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import process from 'node:process';
import {
  getManagedSpawnOptions,
  terminateProcessTreeSync,
} from '../managed-child-process.mjs';

function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ESRCH'
    ) {
      return false;
    }

    return true;
  }
}

async function waitForProcessExit(pid: number, timeoutMs = 10_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!isProcessRunning(pid)) {
      return;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
  }

  throw new Error(`Timed out waiting for pid ${pid} to exit.`);
}

describe('managed child process helpers', () => {
  it('uses detached child groups on non-Windows platforms', () => {
    expect(getManagedSpawnOptions({ stdio: 'ignore' })).toMatchObject({
      detached: process.platform !== 'win32',
      stdio: 'ignore',
    });
  });

  it('terminates a spawned child process tree', async () => {
    const childScriptPath = resolve(
      process.cwd(),
      'scripts',
      'tests',
      'fixtures',
      'process-tree-child.mjs',
    );
    const child = spawn(process.execPath, [childScriptPath], {
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    try {
      if (!child.pid || !child.stdout) {
        throw new Error('Expected the fixture child process to start.');
      }

      const [chunk] = await once(child.stdout, 'data');
      const grandchildPid = Number(String(chunk).trim());

      expect(Number.isInteger(grandchildPid)).toBe(true);
      expect(isProcessRunning(child.pid)).toBe(true);
      expect(isProcessRunning(grandchildPid)).toBe(true);

      terminateProcessTreeSync(child.pid);

      await Promise.all([
        waitForProcessExit(child.pid),
        waitForProcessExit(grandchildPid),
      ]);
    } finally {
      if (child.pid && isProcessRunning(child.pid)) {
        terminateProcessTreeSync(child.pid);
      }
    }
  }, 15_000);
});
