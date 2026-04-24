import { PRE_PUSH_COMMANDS } from '../run-pre-push-quality.helpers.mjs';

describe('pre-push quality commands', () => {
  it('runs the repository-wide validation steps before push', () => {
    expect(PRE_PUSH_COMMANDS).toEqual([
      'typecheck',
      'lint',
      'test',
      'build:budget:strict',
    ]);
  });
});
