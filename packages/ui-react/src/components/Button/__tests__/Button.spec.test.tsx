import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { ButtonTestkit } from './ButtonTestkit';

setupUiTestEnvironment();

describe('Button', () => {
  let testkit: ButtonTestkit;

  beforeEach(() => {
    testkit = new ButtonTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('marks small buttons with the shared size attribute', async () => {
    await testkit.actions.renderCompactAction();

    await testkit.expect.buttonUsesSize('small');
  });

  it('marks destructive buttons with the shared tone attribute', async () => {
    await testkit.actions.renderDestructiveAction();

    await testkit.expect.buttonUsesTone('danger');
  });
});
