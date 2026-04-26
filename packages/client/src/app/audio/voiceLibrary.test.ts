import {
  getVoiceClipCount,
  getVoiceClipUrls,
  pickVoiceClipUrl,
} from './voiceLibrary';

describe('voiceLibrary', () => {
  it('indexes voice clips without requiring eager url imports', async () => {
    expect(getVoiceClipCount('alex-brodie', 'damage')).toBeGreaterThan(0);

    const clipUrl = await pickVoiceClipUrl('alex-brodie', 'damage', {});
    expect(clipUrl).toMatch(/\.wav/);
  });

  it('keeps the existing category url helper asynchronous', async () => {
    await expect(getVoiceClipUrls('alex-brodie', 'damage')).resolves.toEqual(
      expect.arrayContaining([expect.stringMatching(/\.wav/)]),
    );
  });
});
