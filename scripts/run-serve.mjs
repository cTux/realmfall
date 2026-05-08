import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createPnpmInvocation } from '../packages/client/scripts/pnpm-command.mjs';
import {
  createWorkspaceServiceInvocations,
  runWorkspaceCommand,
  runWorkspaceServices,
} from './workspace-services.mjs';

export function createWorkspaceServePlan(environment = process.env) {
  return {
    build: createPnpmInvocation(['build'], environment),
    services: createWorkspaceServiceInvocations(
      [
        {
          name: 'client',
          packageName: '@realmfall/client-web',
          script: 'serve',
        },
        {
          name: 'server-world',
          packageName: '@realmfall/server-world',
          script: 'serve',
        },
      ],
      environment,
    ),
  };
}

export async function runWorkspaceServe(environment = process.env) {
  const plan = createWorkspaceServePlan(environment);
  await runWorkspaceCommand(plan.build, environment);
  await runWorkspaceServices(plan.services, environment);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await runWorkspaceServe();
}
