import { collectMissingSharedTestScripts } from './workspaceTestScriptsTestkit';

describe('workspace shared test scripts', () => {
  it('gives every package-owned test entrypoint a shared local test script', () => {
    expect(collectMissingSharedTestScripts()).toEqual([]);
  });
});
