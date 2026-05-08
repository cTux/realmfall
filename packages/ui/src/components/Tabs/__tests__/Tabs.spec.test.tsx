import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { TabsTestkit } from './TabsTestkit';

setupUiTestEnvironment();

describe('Tabs', () => {
  let testkit: TabsTestkit;

  beforeEach(() => {
    testkit = new TabsTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('marks the active tab on the shared button surface and forwards clicks', async () => {
    await testkit.actions.render();

    await testkit.expect.graphicsTabUsesSharedButtonSurface();
    await testkit.expect.audioTabUsesSharedButtonSurface();
    await testkit.actions.clickAudioTab();

    await testkit.expect.audioTabSelectionForwarded();
  });
});
