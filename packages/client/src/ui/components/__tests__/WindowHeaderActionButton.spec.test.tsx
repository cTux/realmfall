import { setupUiTestEnvironment } from '../../uiTestHelpers';
import { WindowHeaderActionButtonTestkit } from './WindowHeaderActionButtonTestkit';

setupUiTestEnvironment();

describe('WindowHeaderActionButton', () => {
  let testkit: WindowHeaderActionButtonTestkit;

  beforeEach(() => {
    testkit = new WindowHeaderActionButtonTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('keeps header actions on the shared small-button contract while blocking disabled clicks', async () => {
    await testkit.expect.contractUsesSmallButton();
    await testkit.expect.isDisabled();
    await testkit.expect.hasHotkey('a');
    await testkit.expect.labelShows('Claim');

    await testkit.actions.hover();

    await testkit.expect.hoverShowsTooltipFor('Claim');
    await testkit.actions.click();
    await testkit.expect.onClickNotCalled();

    await testkit.actions.unhover();
    await testkit.expect.leaveTooltipTriggered();
  });
});
