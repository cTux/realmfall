import { readFileSync } from 'node:fs';

describe('pull request workflow', () => {
  it('fails build validation when startup bundle budgets are exceeded', () => {
    const workflow = readFileSync('.github/workflows/pull-request.yml', 'utf8');

    expect(workflow).toContain('run: pnpm build:budget:strict');
    expect(workflow).not.toContain('run: pnpm build:budget\n');
  });
});
