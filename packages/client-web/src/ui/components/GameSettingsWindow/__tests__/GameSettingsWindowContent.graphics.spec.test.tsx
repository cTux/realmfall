import { applyGraphicsPreset } from '../../../../app/graphicsSettings';
import { t } from '../../../../i18n';
import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';

describe('GameSettingsWindowContent graphics', () => {
  let testkit: GameSettingsWindowContentTestkit;

  beforeEach(() => {
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('applies the selected graphics preset to the saved payload', async () => {
    await testkit.actions.chooseGraphicsPreset('performance');
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      graphics: applyGraphicsPreset('performance'),
    });
  });

  it('saves the selected Pixi render FPS inside the graphics payload', async () => {
    await testkit.actions.setWorldRenderFps(120);
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      graphics: {
        preset: 'custom',
        worldRenderFps: 120,
      },
    });
  });

  it('saves the terrain background toggle inside the graphics payload', async () => {
    await testkit.actions.toggleShowTerrainBackgrounds();
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      graphics: {
        preset: 'custom',
        showTerrainBackgrounds: false,
      },
    });
  });

  it('saves cloud visibility and transparency inside the graphics payload', async () => {
    await testkit.actions.setCloudTransparency(65);
    await testkit.actions.toggleShowClouds();
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      graphics: {
        cloudTransparency: 65,
        preset: 'custom',
        showClouds: false,
      },
    });
  });

  it('marks renderer initialization graphics toggles as reload-required', async () => {
    await testkit.expect.graphicsSettingRequiresReload('antialias');
    await testkit.expect.graphicsSettingDoesNotRequireReload(
      'showTerrainBackgrounds',
    );
  });

  it('shows performance impact labels on graphics presets, the FPS control, and toggles', async () => {
    await testkit.expect.textContains(
      t('ui.settings.graphics.performanceImpact.label'),
    );
    await testkit.expect.graphicsPresetImpact('quality', 'high');
    await testkit.expect.graphicsSettingImpact('worldRenderFps', 'low');
    await testkit.expect.graphicsSettingImpact(
      'showTerrainBackgrounds',
      'medium',
    );
  });

  it('updates the Pixi render FPS impact label as the slider changes', async () => {
    await testkit.expect.graphicsSettingImpact('worldRenderFps', 'low');

    await testkit.actions.setWorldRenderFps(180);

    await testkit.expect.graphicsSettingImpact('worldRenderFps', 'high');
  });
});
