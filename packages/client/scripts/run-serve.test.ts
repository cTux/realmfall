import { createWorkspaceServePlan } from '../../../scripts/run-serve.mjs';

describe('workspace serve plan', () => {
  it('builds the workspace before launching both serve targets', () => {
    const plan = createWorkspaceServePlan({
      npm_execpath: '/tmp/pnpm.cjs',
    });

    expect(plan.build.command).toBe(process.execPath);
    expect(plan.build.args).toEqual(['/tmp/pnpm.cjs', 'build']);
    expect(plan.services).toEqual([
      {
        command: process.execPath,
        args: ['/tmp/pnpm.cjs', '--filter', '@realmfall/client', 'serve'],
        name: 'client',
      },
      {
        command: process.execPath,
        args: ['/tmp/pnpm.cjs', '--filter', '@realmfall/server', 'serve'],
        name: 'server',
      },
    ]);
  });
});
