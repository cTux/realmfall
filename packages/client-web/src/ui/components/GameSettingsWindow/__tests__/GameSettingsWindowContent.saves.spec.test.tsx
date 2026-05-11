import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';

describe('GameSettingsWindowContent saves', () => {
  let testkit: GameSettingsWindowContentTestkit;

  beforeEach(() => {
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('confirms before resetting a specific save area', async () => {
    await testkit.actions.openTab('saves');
    await testkit.mock.confirmPromptAccept();
    await testkit.actions.clickDataResetFor('game');

    await testkit.expect.confirmPromptShownFor('game');
    await testkit.expect.resetTriggeredFor('game');
  });

  it('cancels a save reset when the confirmation prompt is rejected', async () => {
    await testkit.actions.openTab('saves');
    await testkit.mock.confirmPromptReject();
    await testkit.actions.clickDataResetFor('ui');

    await testkit.expect.confirmPromptShown();
    await testkit.expect.resetNotTriggeredFor('ui');
  });
});
