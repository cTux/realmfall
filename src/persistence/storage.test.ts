import { loadEncryptedState, saveEncryptedState } from './storage';

describe('encrypted storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips persisted state through localStorage', async () => {
    const payload = {
      game: { turn: 7, player: { hp: 12 } },
      ui: {
        windows: { hero: { x: 10, y: 20 } },
        windowCollapsed: { hero: true },
      },
    };

    await saveEncryptedState(payload);

    const raw = localStorage.getItem('survival-rpg-save');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('"turn":7');

    await expect(loadEncryptedState()).resolves.toEqual(payload);
  });

  it('returns null for missing or invalid payloads', async () => {
    await expect(loadEncryptedState()).resolves.toBeNull();

    localStorage.setItem('survival-rpg-save', 'not-json');
    await expect(loadEncryptedState()).resolves.toBeNull();
  });
});
