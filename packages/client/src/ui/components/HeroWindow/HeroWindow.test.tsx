import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { t } from '../../../i18n';
import { renderWindowHotkeyLabelText } from '../../hotkeyLabels';
import { HeroWindow } from './HeroWindow';
import styles from './styles.module.scss';
import type { HeroOverview } from './types';
import { WINDOW_LABELS } from '../../windowLabels';

const hero: HeroOverview = {
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
  bonusExperience: 143,
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
  secondaryStatTotals: {
    attackSpeed: { effective: 1.25, raw: 1.25 },
    bonusExperience: { effective: 143, raw: 143 },
    criticalStrikeChance: { effective: 75, raw: 143 },
    criticalStrikeDamage: { effective: 175, raw: 243 },
    lifestealChance: { effective: 10, raw: 10 },
    lifestealAmount: { effective: 8, raw: 8 },
    dodgeChance: { effective: 12, raw: 12 },
    blockChance: { effective: 18, raw: 18 },
    suppressDamageChance: { effective: 6, raw: 6 },
    suppressDamageReduction: { effective: 35, raw: 35 },
    suppressDebuffChance: { effective: 9, raw: 9 },
    bleedChance: { effective: 11, raw: 11 },
    poisonChance: { effective: 13, raw: 13 },
    burningChance: { effective: 14, raw: 14 },
    chillingChance: { effective: 7, raw: 7 },
    powerBuffChance: { effective: 5, raw: 5 },
    frenzyBuffChance: { effective: 4, raw: 4 },
  },
  statusEffects: [],
  buffs: [],
  debuffs: [],
  abilityIds: [],
  level: 1,
  masteryLevel: 0,
  skills: {
    gathering: { level: 1, xp: 0 },
    hand: { level: 1, xp: 0 },
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
          hero={hero}
          hunger={0}
          thirst={0}
        />,
      );
    });

    expect(host.textContent).toContain(
      renderWindowHotkeyLabelText(WINDOW_LABELS.hero),
    );
    expect(
      host.querySelector(`[aria-label="${t('ui.loading.window')}"]`),
    ).not.toBeNull();
  });

  it('renders the hero summary with the detailed derived stat list', async () => {
    await act(async () => {
      root.render(
        <HeroWindow
          position={{ x: 16, y: 24 }}
          onMove={() => {}}
          visible
          hero={hero}
          hunger={0}
          thirst={0}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(host.textContent).toContain(t('ui.hero.statSheet.primary'));
    expect(host.textContent).toContain(t('ui.hero.statSheet.secondary'));
    expect(host.textContent).toContain('Bonus Experience');
    expect(host.textContent).toContain('143%');
    expect(host.textContent).toContain('Critical Strike Chance');
    expect(host.textContent).toContain('75% (143% raw)');
    expect(host.textContent).toContain('Attack Speed');
    expect(host.textContent).toContain('25%');
    expect(host.textContent).toContain('Suppress Debuff Chance');
    expect(host.textContent).toContain(
      renderWindowHotkeyLabelText(WINDOW_LABELS.hero),
    );
    expect(host.textContent).not.toContain('Hero infoHP');
  });

  it('renders a resizable shell with an internal stat sheet scroller', async () => {
    await act(async () => {
      root.render(
        <HeroWindow
          position={{ x: 16, y: 24, width: 320, height: 260 }}
          onMove={() => {}}
          visible
          hero={hero}
          hunger={0}
          thirst={0}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const windowNode = host.querySelector(
      `.${styles.window}`,
    ) as HTMLElement | null;
    const statsScroller = host.querySelector(
      `.${styles.stats}`,
    ) as HTMLElement | null;

    expect(windowNode).not.toBeNull();
    expect(windowNode?.style.width).toBe('320px');
    expect(windowNode?.style.height).toBe('260px');
    expect(
      windowNode?.querySelector('div[class*="resizeHandle"]'),
    ).not.toBeNull();
    expect(statsScroller).not.toBeNull();
  });

  it('keeps the hero summary outside the stat scroller', async () => {
    await act(async () => {
      root.render(
        <HeroWindow
          position={{ x: 16, y: 24, width: 320, height: 260 }}
          onMove={() => {}}
          visible
          hero={hero}
          hunger={0}
          thirst={0}
        />,
      );
    });

    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.resolve();
      await Promise.resolve();
    });

    const summary = host.querySelector(
      `.${styles.summary}`,
    ) as HTMLElement | null;
    const statsScroller = host.querySelector(
      `.${styles.stats}`,
    ) as HTMLElement | null;

    expect(summary).not.toBeNull();
    expect(statsScroller).not.toBeNull();
    expect(statsScroller?.contains(summary as Node)).toBe(false);
    expect(statsScroller?.textContent).toContain(
      t('ui.hero.statSheet.primary'),
    );
    expect(statsScroller?.textContent).toContain(
      t('ui.hero.statSheet.secondary'),
    );
  });
});
