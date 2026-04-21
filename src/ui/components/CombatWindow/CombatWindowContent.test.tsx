import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { setWorldClockTime } from '../../../app/App/worldClockStore';
import { createCombatActorState } from '../../../game/combat';
import type {
  CombatState,
  Enemy,
  PlayerStatusEffect,
} from '../../../game/types';
import { t } from '../../../i18n';
import { CombatWindowContent } from './CombatWindowContent';
import type { CombatPartyMember } from './types';

const WORLD_TIME_MS = 12_000;
const COORD = { q: 1, r: 0 };

const enemyStatusEffects: Pick<
  PlayerStatusEffect,
  'id' | 'value' | 'tickIntervalMs' | 'stacks'
>[] = [
  { id: 'power', value: 10 },
  { id: 'guard', value: 15 },
  { id: 'frenzy', value: 20 },
];

const playerParty: CombatPartyMember[] = [
  {
    id: 'player',
    name: 'Player',
    level: 7,
    hp: 42,
    maxHp: 42,
    mana: 18,
    maxMana: 18,
    attack: 12,
    actor: createCombatActorState(WORLD_TIME_MS, ['kick']),
    buffs: [],
    debuffs: [],
  },
];

const enemies: Enemy[] = [
  {
    id: 'enemy-1',
    name: 'Wolf',
    coord: COORD,
    rarity: 'rare',
    tier: 2,
    hp: 30,
    maxHp: 34,
    mana: 100,
    maxMana: 100,
    attack: 10,
    defense: 8,
    xp: 64,
    elite: true,
    statusEffects: enemyStatusEffects,
    abilityIds: ['kick'],
  },
];

const combat: CombatState = {
  coord: COORD,
  enemyIds: ['enemy-1'],
  started: true,
  player: createCombatActorState(WORLD_TIME_MS, ['kick']),
  enemies: {
    'enemy-1': createCombatActorState(WORLD_TIME_MS, ['kick']),
  },
};

describe('CombatWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    setWorldClockTime(0);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    setWorldClockTime(0);
    host.remove();
  });

  it('shows the enemy stat sheet when hovering a non-player HP bar', async () => {
    const onHoverDetail = vi.fn();

    await act(async () => {
      root.render(
        <CombatWindowContent
          combat={combat}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={WORLD_TIME_MS}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    const enemyHpBar = findPrimaryBarByTitle(host, 'Wolf Lv 2');

    expect(enemyHpBar).not.toBeNull();

    await act(async () => {
      enemyHpBar?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    const enemyHoverCall =
      onHoverDetail.mock.calls[onHoverDetail.mock.calls.length - 1];

    expect(enemyHoverCall?.[1]).toBe('Wolf Lv 2');
    expect(enemyHoverCall?.[3]).toBe('rgba(248, 113, 113, 0.9)');
    expect(enemyHoverCall?.[2]).toEqual(
      expect.arrayContaining([
        {
          kind: 'text',
          text: t('ui.hero.statSheet.primary'),
          tone: 'section',
        },
        {
          kind: 'stat',
          label: t('ui.tooltip.maxHealth'),
          value: '34',
        },
        {
          kind: 'stat',
          label: t('ui.hero.attack'),
          value: '11',
        },
        {
          kind: 'stat',
          label: t('ui.hero.defense'),
          value: '9',
        },
        {
          kind: 'text',
          text: t('ui.hero.statSheet.secondary'),
          tone: 'section',
        },
        {
          kind: 'stat',
          label: t('ui.hero.effect.attackSpeed'),
          value: '20%',
        },
        {
          kind: 'stat',
          label: 'Critical Strike Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Critical Strike Damage',
          value: '150%',
        },
        {
          kind: 'stat',
          label: 'Dodge Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Suppress Damage Chance',
          value: '5%',
        },
        {
          kind: 'stat',
          label: 'Suppress Damage Reduction',
          value: '50%',
        },
      ]),
    );
  });

  it('keeps the player HP bar tooltip as the basic combat-health description', async () => {
    const onHoverDetail = vi.fn();

    await act(async () => {
      root.render(
        <CombatWindowContent
          combat={combat}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={WORLD_TIME_MS}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    const playerHpBar = findPrimaryBarByTitle(host, 'Player Lv 7');

    expect(playerHpBar).not.toBeNull();

    await act(async () => {
      playerHpBar?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(onHoverDetail).toHaveBeenCalledWith(
      expect.anything(),
      t('ui.hero.hp'),
      [{ kind: 'text', text: t('ui.tooltip.bar.combatHp') }],
      'rgba(248, 113, 113, 0.9)',
    );
  });

  it('disables combat abilities on cooldown without rendering overlays or cast bars', async () => {
    const onHoverDetail = vi.fn();
    const enemyActor = createCombatActorState(WORLD_TIME_MS, ['kick']);
    enemyActor.globalCooldownEndsAt = WORLD_TIME_MS + 1_000;
    enemyActor.cooldownEndsAt.kick = WORLD_TIME_MS + 1_000;
    enemyActor.casting = {
      abilityId: 'kick',
      targetId: 'player',
      endsAt: WORLD_TIME_MS + 500,
    };

    await act(async () => {
      root.render(
        <CombatWindowContent
          combat={{
            ...combat,
            enemies: {
              ...combat.enemies,
              'enemy-1': enemyActor,
            },
          }}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={WORLD_TIME_MS}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={() => {}}
        />,
      );
    });

    const enemyCard = findEntityCardByTitle(host, 'Wolf Lv 2');
    const abilityButton = enemyCard?.querySelector(
      'button[aria-label="Kick"]',
    ) as HTMLButtonElement | null;
    const barStack = enemyCard?.querySelector(
      'div[class*="barStack"]',
    ) as HTMLDivElement | null;

    expect(abilityButton).not.toBeNull();
    expect(abilityButton?.className).toContain('iconButtonDisabled');
    expect(abilityButton?.getAttribute('aria-disabled')).toBe('true');
    expect(
      abilityButton?.querySelector('[class*="cooldownOverlay"]'),
    ).toBeNull();
    expect(barStack?.children.length).toBe(2);
    expect(host.querySelector('[class*="castBar"]')).toBeNull();
  });

  it('prefers the live world clock store time over the prop fallback for cooldown state', async () => {
    const enemyActor = createCombatActorState(WORLD_TIME_MS, ['kick']);
    enemyActor.globalCooldownEndsAt = WORLD_TIME_MS + 500;
    enemyActor.cooldownEndsAt.kick = WORLD_TIME_MS + 500;
    setWorldClockTime(WORLD_TIME_MS + 1_000);

    await act(async () => {
      root.render(
        <CombatWindowContent
          combat={{
            ...combat,
            enemies: {
              ...combat.enemies,
              'enemy-1': enemyActor,
            },
          }}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={WORLD_TIME_MS}
          onHoverDetail={() => {}}
          onLeaveDetail={() => {}}
        />,
      );
    });

    const enemyCard = findEntityCardByTitle(host, 'Wolf Lv 2');
    const abilityButton = enemyCard?.querySelector(
      'button[aria-label="Kick"]',
    ) as HTMLButtonElement | null;

    expect(abilityButton).not.toBeNull();
    expect(abilityButton?.className).not.toContain('iconButtonDisabled');
    expect(abilityButton?.getAttribute('aria-disabled')).not.toBe('true');
  });
});

function findPrimaryBarByTitle(host: HTMLElement, title: string) {
  const entityCard = findEntityCardByTitle(host, title);

  return entityCard?.querySelector(
    'div[class*="primaryBar"]',
  ) as HTMLDivElement | null;
}

function findEntityCardByTitle(host: HTMLElement, title: string) {
  const titleNode = Array.from(host.querySelectorAll('strong')).find(
    (node) => node.textContent === title,
  );

  return titleNode?.closest(
    'div[class*="entityCard"]',
  ) as HTMLDivElement | null;
}
