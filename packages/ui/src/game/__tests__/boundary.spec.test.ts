import { UiGameBoundaryTestkit } from './UiGameBoundaryTestkit';

describe('ui game package boundaries', () => {
  let testkit: UiGameBoundaryTestkit;

  beforeEach(() => {
    testkit = new UiGameBoundaryTestkit();
  });

  it('enforces no direct client imports outside explicit bridge modules', () => {
    const violations = testkit.actions.collectViolations();

    testkit.expect.noDirectClientImportsOutsideBridges(violations);
  });
});
