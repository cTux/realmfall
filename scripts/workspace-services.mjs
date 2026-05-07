import process from 'node:process';
import {
  spawnManagedChild,
  terminateProcessTreeSync,
} from '../packages/client/scripts/managed-child-process.mjs';
import { createPnpmInvocation } from '../packages/client/scripts/pnpm-command.mjs';

export function createWorkspaceServiceInvocations(
  serviceDefinitions,
  environment = process.env,
) {
  return serviceDefinitions.map(({ name, packageName, script }) => ({
    name,
    ...createPnpmInvocation(['--filter', packageName, script], environment),
  }));
}

function spawnWorkspaceCommand(invocation, environment = process.env) {
  return spawnManagedChild(invocation.command, invocation.args, {
    env: environment,
    stdio: 'inherit',
  });
}

function stopSiblingServices(services, exitingService) {
  for (const service of services) {
    if (service === exitingService) {
      continue;
    }

    if (service.child.exitCode !== null || service.child.signalCode !== null) {
      continue;
    }

    terminateProcessTreeSync(service.child.pid);
  }
}

export async function runWorkspaceCommand(
  invocation,
  environment = process.env,
) {
  await new Promise((resolve, reject) => {
    const child = spawnWorkspaceCommand(invocation, environment);

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        process.exit(1);
      }

      if ((code ?? 1) !== 0) {
        process.exit(code ?? 1);
      }

      resolve(undefined);
    });
  });
}

export async function runWorkspaceServices(
  serviceInvocations,
  environment = process.env,
) {
  await new Promise((resolve, reject) => {
    const services = serviceInvocations.map((service) => ({
      ...service,
      child: spawnWorkspaceCommand(service, environment),
    }));
    let settled = false;

    const finalize = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      callback();
    };

    for (const service of services) {
      service.child.once('error', (error) => {
        finalize(() => {
          stopSiblingServices(services, service);
          reject(error);
        });
      });

      service.child.once('exit', (code, signal) => {
        finalize(() => {
          stopSiblingServices(services, service);

          if (signal) {
            process.exit(1);
          }

          if ((code ?? 0) !== 0) {
            process.exit(code ?? 1);
          }

          resolve(undefined);
        });
      });
    }
  });
}
