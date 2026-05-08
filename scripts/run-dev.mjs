import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  createWorkspaceServiceInvocations,
  runWorkspaceServices,
} from './workspace-services.mjs';

export function createWorkspaceDevPlan(environment = process.env) {
  return {
    services: createWorkspaceServiceInvocations(
      [
        {
          name: 'client',
          packageName: '@realmfall/client-web',
          script: 'dev',
        },
        {
          name: 'server-world',
          packageName: '@realmfall/server-world',
          script: 'dev',
        },
      ],
      environment,
    ),
  };
}

export async function runWorkspaceDev(environment = process.env) {
  const plan = createWorkspaceDevPlan(environment);
  await runWorkspaceServices(plan.services, environment);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await runWorkspaceDev();
}
