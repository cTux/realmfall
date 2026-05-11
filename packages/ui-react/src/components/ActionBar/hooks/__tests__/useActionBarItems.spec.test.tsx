import { setupUiTestEnvironment } from '../../../../test/uiTestHelpers';
import { UseActionBarItemsTestkit } from './useActionBarItemsTestkit';

setupUiTestEnvironment();

describe('useActionBarItems', () => {
  let testkit: UseActionBarItemsTestkit;

  beforeEach(() => {
    testkit = new UseActionBarItemsTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('keeps consumable and slot derivation stable across unrelated rerenders', async () => {
    await testkit.actions.renderTick(0);
    await testkit.actions.renderTick(1);

    await testkit.expect.derivationsStayStableAcrossRerenders();
  });
});
