import { createWorkspaceDevPlan } from './run-devTestkit';

describe('workspace dev plan', () => {
  it('launches both dev targets without a build step', () => {
    const plan = createWorkspaceDevPlan({
      npm_execpath: '/tmp/pnpm.cjs',
    });

    expect(plan.services).toEqual([
      {
        command: process.execPath,
        args: ['/tmp/pnpm.cjs', '--filter', '@realmfall/client', 'dev'],
        name: 'client',
      },
      {
        command: process.execPath,
        args: ['/tmp/pnpm.cjs', '--filter', '@realmfall/server-world', 'dev'],
        name: 'server-world',
      },
    ]);
  });
});
