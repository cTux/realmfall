import { readFileSync } from 'node:fs';

describe('pull request workflow', () => {
  it('runs workspace node tests and fails build validation when startup bundle budgets are exceeded', () => {
    const workflow = readFileSync('.github/workflows/pull-request.yml', 'utf8');

    expect(workflow).toContain('run: pnpm test');
    expect(workflow).not.toContain('run: pnpm test:node');
    expect(workflow).toContain('run: pnpm build:budget:strict');
    expect(workflow).not.toContain('run: pnpm build:budget\n');
  });
});
