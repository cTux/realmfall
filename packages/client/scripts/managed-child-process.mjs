import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

function isMissingProcessError(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ESRCH'
  );
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (isMissingProcessError(error)) {
      return false;
    }

    return true;
  }
}

function getCleanupSignals() {
  return process.platform === 'win32'
    ? ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']
    : ['SIGINT', 'SIGTERM', 'SIGHUP'];
}

export function getManagedSpawnOptions(options = {}) {
  return {
    ...options,
    detached: options.detached ?? process.platform !== 'win32',
  };
}

export function terminateProcessTreeSync(pid) {
  if (!pid || pid <= 0) {
    return;
  }

  if (process.platform === 'win32') {
    const result = spawnSync(
      'taskkill.exe',
      ['/pid', String(pid), '/t', '/f'],
      {
        stdio: 'ignore',
        windowsHide: true,
      },
    );

    if (result.error && isProcessRunning(pid)) {
      throw result.error;
    }

    if ((result.status ?? 0) !== 0 && isProcessRunning(pid)) {
      throw new Error(`Failed to terminate process tree for pid ${pid}.`);
    }

    return;
  }

  try {
    process.kill(-pid, 'SIGKILL');
    return;
  } catch (error) {
    if (!isMissingProcessError(error)) {
      try {
        process.kill(pid, 'SIGKILL');
        return;
      } catch (fallbackError) {
        if (!isMissingProcessError(fallbackError)) {
          throw fallbackError;
        }
      }
    }
  }
}

export function attachChildProcessCleanup(child) {
  let removed = false;
  const listeners = [];

  const cleanup = () => {
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }

    terminateProcessTreeSync(child.pid);
  };

  const removeListeners = () => {
    if (removed) {
      return;
    }

    removed = true;
    for (const [eventName, listener] of listeners) {
      process.off(eventName, listener);
    }
  };

  const addListener = (eventName, listener) => {
    process.on(eventName, listener);
    listeners.push([eventName, listener]);
  };

  const handleSignal = (signal) => {
    removeListeners();
    cleanup();

    if (process.platform !== 'win32') {
      try {
        process.kill(process.pid, signal);
        return;
      } catch {
        // Fall back to a regular exit if re-raising the signal fails.
      }
    }

    process.exit(1);
  };

  for (const signal of getCleanupSignals()) {
    addListener(signal, () => {
      handleSignal(signal);
    });
  }

  addListener('exit', cleanup);

  child.once('exit', removeListeners);
  child.once('error', removeListeners);

  return {
    cleanup,
    removeListeners,
  };
}

export function spawnManagedChild(command, args, options = {}) {
  const child = spawn(command, args, getManagedSpawnOptions(options));
  attachChildProcessCleanup(child);
  return child;
}
