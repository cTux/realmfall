import { PRE_PUSH_COMMANDS } from '../run-pre-push-quality.helpers.mjs';

describe('pre-push quality commands', () => {
  it('runs the full-project typecheck gate before push', () => {
    expect(PRE_PUSH_COMMANDS).toEqual(['typecheck']);
  });
});
