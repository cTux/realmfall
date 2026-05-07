import { readFileSync } from 'node:fs';

const validationWorkflowPaths = [
  '.github/workflows/pull-request-validation.yml',
  '.github/workflows/master-branch-validation.yml',
];

describe('validation workflows', () => {
  it.each(validationWorkflowPaths)(
    '%s runs workspace node tests and runs the production build check',
    (filePath) => {
      const workflow = readFileSync(filePath, 'utf8');

      expect(workflow).toContain('run: pnpm test');
      expect(workflow).not.toContain('run: pnpm test:node');
      expect(workflow).toContain('run: pnpm build');
      expect(workflow).not.toContain('run: pnpm build:budget:strict');
      expect(workflow).not.toContain('run: pnpm build:budget\n');
    },
  );
});
