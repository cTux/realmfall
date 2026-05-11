import { setupUiTestEnvironment } from '../../uiTestkit';
import { WINDOW_LOADING_WARNING_DELAY_MS } from '../WindowLoadingState';
import { WindowLoadingStateTestkit } from './WindowLoadingStateTestkit';
import { t } from '../../../i18n';

setupUiTestEnvironment();

describe('WindowLoadingState', () => {
  const warningText = t('ui.loading.windowDelayed');
  let testkit: WindowLoadingStateTestkit;

  beforeEach(() => {
    testkit = new WindowLoadingStateTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows a delayed warning when window content is still loading', async () => {
    await testkit.expect.notShowingWarning(warningText);

    await testkit.actions.advanceTime(WINDOW_LOADING_WARNING_DELAY_MS - 1);
    await testkit.expect.notShowingWarning(warningText);

    await testkit.actions.advanceTime(1);
    await testkit.expect.showingWarning(warningText);
  });
});
