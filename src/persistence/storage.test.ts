import { loadEncryptedState, saveEncryptedState } from './storage';

describe('encrypted storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips persisted state through localStorage', async () => {
    const payload = {
      game: { turn: 7, player: { hp: 12 } },
      ui: {
        windows: { hero: { x: 10, y: 20, width: 420, height: 280 } },
        windowShown: { hero: true },
      },
    };

    await saveEncryptedState(payload);

    const raw = localStorage.getItem('game-state');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('"turn":7');
    expect(localStorage.getItem('survival-rpg-save')).toBeNull();

    await expect(loadEncryptedState()).resolves.toEqual(payload);
  });

  it('migrates legacy save payloads to the new storage key', async () => {
    const payload = {
      game: { turn: 3 },
      ui: { windowShown: { hero: true } },
    };

    await saveEncryptedState(payload);

    const legacyPayload = localStorage.getItem('game-state');
    localStorage.removeItem('game-state');
    localStorage.setItem('survival-rpg-save', legacyPayload!);

    await expect(loadEncryptedState()).resolves.toEqual(payload);
    expect(localStorage.getItem('game-state')).toBe(legacyPayload);
    expect(localStorage.getItem('survival-rpg-save')).toBeNull();
  });

  it('returns null for missing or invalid payloads', async () => {
    await expect(loadEncryptedState()).resolves.toBeNull();

    localStorage.setItem('game-state', 'not-json');
    await expect(loadEncryptedState()).resolves.toBeNull();
  });
});
