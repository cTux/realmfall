import { setupUiTestEnvironment } from '../../../uiTestkit';
import { VersionStatusWidgetTestkit } from './VersionStatusWidgetTestkit';

setupUiTestEnvironment();

describe('VersionStatusWidget', () => {
  let testkit: VersionStatusWidgetTestkit;

  beforeEach(() => {
    testkit = new VersionStatusWidgetTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows the get new version action only when the remote version differs', async () => {
    await testkit.expect.refreshButtonVisible();
    await testkit.actions.clickRefresh();

    await testkit.expect.onRefreshCalled();
    await testkit.actions.hoverRefresh();

    await testkit.expect.refreshHoverShowsVersionInfo({
      currentVersion: '1.0.0',
      remoteVersion: '1.0.1',
    });
    await testkit.actions.unhoverRefresh();

    await testkit.expect.leaveTooltipTriggered();
  });
});
