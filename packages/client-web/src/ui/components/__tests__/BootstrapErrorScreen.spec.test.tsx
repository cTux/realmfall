import { setupUiTestEnvironment } from '../../uiTestkit';
import { BOOTSTRAP_ERROR_RELOAD_DELAY_MS } from '../BootstrapErrorScreen';
import { BootstrapErrorScreenTestkit } from './BootstrapErrorScreenTestkit';

setupUiTestEnvironment();

describe('BootstrapErrorScreen', () => {
  let testkit: BootstrapErrorScreenTestkit;

  beforeEach(() => {
    testkit = new BootstrapErrorScreenTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('counts down from 2 seconds and reloads automatically', async () => {
    await testkit.expect.loadingTitleVisible();
    await testkit.expect.countdownMessageShows(2);
    await testkit.expect.reloadNotCalled();

    await testkit.actions.advanceTime(BOOTSTRAP_ERROR_RELOAD_DELAY_MS / 2);
    await testkit.expect.countdownMessageShows(1);
    await testkit.expect.reloadNotCalled();

    await testkit.actions.advanceTime(BOOTSTRAP_ERROR_RELOAD_DELAY_MS / 2);
    await testkit.expect.reloadTriggered();
  });
});
