import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { WindowDockTestkit } from './WindowDockTestkit';

setupUiTestEnvironment();

describe('WindowDock', () => {
  let testkit: WindowDockTestkit;

  beforeEach(() => {
    testkit = new WindowDockTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows the focused entry tooltip on the shared button surface', async () => {
    await testkit.actions.render();

    await testkit.expect.buttonUsesSharedSurface();
    await testkit.expect.dockAllowsPointerEvents();
    await testkit.expect.tooltipHidden();
    await testkit.actions.focusInventoryEntry();
    await testkit.expect.tooltipVisible();
  });

  it('forwards toggles and clears the focused tooltip after click', async () => {
    await testkit.actions.render();

    await testkit.expect.buttonUsesSharedSurface();
    await testkit.actions.focusInventoryEntry();
    await testkit.expect.tooltipVisible();
    await testkit.actions.clickInventoryEntry();

    await testkit.expect.inventoryToggleForwarded();
    await testkit.expect.tooltipHidden();
  });
});
