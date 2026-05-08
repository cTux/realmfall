import { InventoryWindowTestkit } from './InventoryWindowTestkit';
import { setupUiTestEnvironment } from '../../../uiTestkit';

setupUiTestEnvironment();

describe('InventoryWindow', () => {
  let testkit: InventoryWindowTestkit;

  beforeEach(() => {
    testkit = new InventoryWindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('opens a single-select sort menu and forwards the selected mode', async () => {
    await testkit.expect.sortButtonVisible();
    await testkit.expect.noCheckboxVisible();

    await testkit.actions.openSortMenu();
    await testkit.expect.menuShowsModeLabels();
    await testkit.expect.noCheckboxVisible();

    await testkit.actions.chooseSortMode('rarity');
    await testkit.expect.sortModeForwarded('rarity');
    await testkit.expect.menuDoesNotShow('Type');
  });
});
