import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { t } from '../../../i18n';
import { HeroWindow } from './HeroWindow';
import type { HeroWindowStats } from './types';

const stats: HeroWindowStats = {
  hp: 10,
  maxHp: 10,
  mana: 5,
  maxMana: 5,
  xp: 0,
  nextLevelXp: 10,
  rawAttack: 1,
  rawDefense: 1,
  attack: 1,
  defense: 1,
  buffs: [],
  debuffs: [],
  abilityIds: [],
  level: 1,
  masteryLevel: 0,
  skills: {
    gathering: { level: 1, xp: 0 },
    cooking: { level: 1, xp: 0 },
    crafting: { level: 1, xp: 0 },
    fishing: { level: 1, xp: 0 },
    logging: { level: 1, xp: 0 },
    mining: { level: 1, xp: 0 },
    skinning: { level: 1, xp: 0 },
  },
};

describe('HeroWindow', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders the window shell while content is still loading', async () => {
    await act(async () => {
      root.render(
        <HeroWindow
          position={{ x: 16, y: 24 }}
          onMove={() => {}}
          visible
          stats={stats}
          hunger={0}
          thirst={0}
          worldTimeMs={0}
        />,
      );
    });

    expect(host.textContent).toContain(t('ui.window.hero.suffix'));
    expect(
      host.querySelector(`[aria-label="${t('ui.loading.window')}"]`),
    ).not.toBeNull();
  });
});
