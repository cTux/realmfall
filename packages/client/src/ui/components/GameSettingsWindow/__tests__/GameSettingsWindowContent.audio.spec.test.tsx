import { DEFAULT_AUDIO_SETTINGS } from '../../../../app/constants';
import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';

describe('GameSettingsWindowContent audio', () => {
  let testkit: GameSettingsWindowContentTestkit;

  beforeEach(() => {
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('updates the music volume slider without reading a cleared event target', async () => {
    await testkit.actions.openTab('audio');
    await testkit.actions.setMusicVolume(65);

    await testkit.expect.musicVolumeEquals(65);
    await testkit.expect.textContains('65%');
  });

  it('saves sound effect toggles inside the audio payload', async () => {
    await testkit.actions.openTab('audio');
    await testkit.actions.toggleSoundEffect('pop');
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      audio: {
        soundEffects: {
          pop: false,
        },
      },
    });
  });

  it('saves the music mute toggle inside the audio payload', async () => {
    await testkit.actions.openTab('audio');
    await testkit.actions.toggleMusicMuted();
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      audio: {
        musicMuted: true,
      },
    });
  });

  it('saves selected voice actor and event toggles inside the audio payload', async () => {
    await testkit.actions.openTab('audio');
    await testkit.actions.chooseVoiceActor('karen-cenon');
    await testkit.actions.toggleVoiceEvent('combatAttack');
    await testkit.actions.save();

    await testkit.expect.savedPayloadMatches({
      audio: {
        voice: {
          actorId: 'karen-cenon',
          events: {
            combatAttack: false,
          },
        },
      },
    });
  });

  it('updates the voice actor select without reading a cleared event target', async () => {
    await testkit.actions.openTab('audio');

    await testkit.expect.voiceActorEquals(DEFAULT_AUDIO_SETTINGS.voice.actorId);

    await testkit.actions.chooseVoiceActor('karen-cenon');

    await testkit.expect.voiceActorEquals('karen-cenon');
  });
});
