import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';

describe('GameSettingsWindowContent interface and gameplay', () => {
  let testkit: GameSettingsWindowContentTestkit;

  beforeEach(() => {
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('saves interface language, font, font size, interface scale, transparency, and gameplay toggles in the payload', async () => {
    await testkit.actions.openTab('interface');

    await testkit.expect.interfaceLanguageEquals('en');
    await testkit.expect.interfaceLanguageOptionsEqual(['en']);

    await testkit.actions.setInterfaceFontSize(118);
    await testkit.actions.setInterfaceScale(126);
    await testkit.actions.setWindowTransparency(45);
    await testkit.actions.chooseInterfaceLanguage('en');
    await testkit.actions.chooseInterfaceFontFamily('ubuntu');
    await testkit.actions.toggleShowTooltipTags();

    await testkit.actions.openTab('gameplay');

    await testkit.expect.gameplaySettingHidden('autoStartCombat');

    await testkit.actions.toggleAutoLoot();
    await testkit.actions.toggleAutoGatherResources();
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      gameplay: {
        autoGatherResources: true,
        autoLoot: true,
      },
      interface: {
        fontFamily: 'ubuntu',
        fontSize: 118,
        interfaceScale: 126,
        language: 'en',
        showTooltipTags: false,
        windowTransparency: 45,
      },
    });
  });
});
