import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { WindowTestkit } from './WindowTestkit';

setupUiTestEnvironment();

describe('Window', () => {
  let testkit: WindowTestkit;

  beforeEach(() => {
    testkit = new WindowTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders the title close button with the shared small size', async () => {
    await testkit.actions.renderWithTitleCloseButton();

    await testkit.expect.closeButtonUsesSharedSmallSize();
  });

  it('uses the shared app window opacity variable when it is provided', async () => {
    await testkit.actions.renderWithOpacityVariable();

    await testkit.expect.windowUsesAppOpacityVariable();
  });
});
