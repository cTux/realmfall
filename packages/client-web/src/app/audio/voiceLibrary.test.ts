import {
  getVoiceClipCount,
  getVoiceClipUrls,
  pickVoiceClipUrl,
  __isVoiceClipLibraryInitializedForTest,
  __resetVoiceClipLibraryForTest,
} from './voiceLibraryTestkit';

beforeEach(() => {
  __resetVoiceClipLibraryForTest();
});

describe('voiceLibrary', () => {
  it('builds the voice clip library lazily on first clip lookup', () => {
    expect(__isVoiceClipLibraryInitializedForTest()).toBe(false);

    expect(getVoiceClipCount('alex-brodie', 'damage')).toBeGreaterThan(0);

    expect(__isVoiceClipLibraryInitializedForTest()).toBe(true);
  });

  it('indexes voice clips without requiring eager url imports', async () => {
    expect(getVoiceClipCount('alex-brodie', 'damage')).toBeGreaterThan(0);

    const clipUrl = await pickVoiceClipUrl('alex-brodie', 'damage', {});
    expect(clipUrl).toMatch(/\.flac/);
  });

  it('keeps the existing category url helper asynchronous', async () => {
    await expect(getVoiceClipUrls('alex-brodie', 'damage')).resolves.toEqual(
      expect.arrayContaining([expect.stringMatching(/\.flac/)]),
    );
  });
});
