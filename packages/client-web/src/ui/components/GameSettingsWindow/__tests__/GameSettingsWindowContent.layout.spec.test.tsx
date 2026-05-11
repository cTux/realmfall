import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';

describe('GameSettingsWindowContent layout', () => {
  let testkit: GameSettingsWindowContentTestkit;

  beforeEach(() => {
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('uses a horizontal tab row with interface and gameplay tabs', async () => {
    await testkit.expect.tabOrientation('horizontal');
    await testkit.expect.tabsVisible([
      'graphics',
      'audio',
      'interface',
      'gameplay',
      'saves',
    ]);
  });
});
