import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
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
  attackSpeed: 1.25,
  criticalStrikeChance: 15,
  criticalStrikeDamage: 175,
  lifestealChance: 10,
  lifestealAmount: 8,
  dodgeChance: 12,
  blockChance: 18,
  suppressDamageChance: 6,
  suppressDamageReduction: 35,
  suppressDebuffChance: 9,
  bleedChance: 11,
  poisonChance: 13,
  burningChance: 14,
  chillingChance: 7,
  powerBuffChance: 5,
  frenzyBuffChance: 4,
  statusEffects: [],
  buffs: [],
  debuffs: [],
  abilityIds: [],
  level: 1,
  masteryLevel: 0,
  skills: {
    gathering: { level: 1, xp: 0 },
    cooking: { level: 1, xp: 0 },
    smelting: { level: 1, xp: 0 },
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

  it('renders the full resulting character stat list', async () => {
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

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(host.textContent).toContain('Critical Strike Chance');
    expect(host.textContent).toContain('175%');
    expect(host.textContent).toContain('Lifesteal Amount');
    expect(host.textContent).toContain('8% max HP');
    expect(host.textContent).toContain('Suppress Debuff Chance');
    expect(host.textContent).toContain('Attack Speed');
    expect(host.textContent).toContain('125%');
  });

  it('omits zero-valued percentage stats from the character stat list', async () => {
    await act(async () => {
      root.render(
        <HeroWindow
          position={{ x: 16, y: 24 }}
          onMove={() => {}}
          visible
          stats={{
            ...stats,
            dodgeChance: 0,
            blockChance: 0,
            suppressDebuffChance: 0,
            bleedChance: 0,
          }}
          hunger={0}
          thirst={0}
          worldTimeMs={0}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(host.textContent).not.toContain('Dodge Chance');
    expect(host.textContent).not.toContain('Block Chance');
    expect(host.textContent).not.toContain('Suppress Debuff Chance');
    expect(host.textContent).not.toContain('Bleed Chance');
    expect(host.textContent).toContain('Attack');
    expect(host.textContent).toContain('Defense');
  });
});
