import { readFileSync } from 'node:fs';

describe('root workspace scripts', () => {
  it('keeps build and lint wired to all workspace packages', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    ) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.build).toBe(
      'pnpm --filter @realmfall/common build && pnpm --filter @realmfall/server build && pnpm --filter @realmfall/ui build && pnpm --filter @realmfall/client build',
    );
    expect(packageJson.scripts.lint).toBe(
      'pnpm --filter @realmfall/common lint && pnpm --filter @realmfall/server lint && pnpm --filter @realmfall/ui lint && pnpm --filter @realmfall/client lint',
    );
  });
});
