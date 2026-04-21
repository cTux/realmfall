import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { getAbilityDefinition } from '../../../game/abilities';
import { createCombatActorState } from '../../../game/combat';
import type { CombatActorState, CombatState, Enemy } from '../../../game/types';
import { CombatWindow } from './CombatWindow';
import type { CombatPartyMember, CombatWindowProps } from './types';

const WORLD_TIME_MS = 12_000;
const WINDOW_POSITION = { x: 64, y: 48 };
const noopHoverDetail: CombatWindowProps['onHoverDetail'] = () => undefined;
const noopLeaveDetail: CombatWindowProps['onLeaveDetail'] = () => undefined;
const noopStart = () => undefined;
const noopMove = () => undefined;
const noopClose = () => undefined;

const meta = {
  title: 'Windows/Combat/Window',
  component: CombatWindow,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    position: WINDOW_POSITION,
    onMove: noopMove,
    visible: true,
    onClose: noopClose,
    worldTimeMs: WORLD_TIME_MS,
    onStart: noopStart,
    onHoverDetail: noopHoverDetail,
    onLeaveDetail: noopLeaveDetail,
  },
  parameters: {
    controls: {
      exclude: [
        'onMove',
        'onClose',
        'onStart',
        'onHoverDetail',
        'onLeaveDetail',
      ],
    },
  },
  render: (args) => <CombatWindowStory {...args} />,
} satisfies Meta<typeof CombatWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EncounterWaitingForStart: Story = {
  args: buildBattleScenario({ started: false }),
};

export const EncounterStartsFromButton: Story = {
  args: buildBattleScenario({ started: false }),
  play: async ({ canvasElement }) => {
    const startButton = await waitForButton(canvasElement, '(Q) Start');
    startButton.click();
  },
};

export const SkirmishInProgress: Story = {
  args: buildBattleScenario({
    started: true,
    partyDamage: [0, 6, 10],
    enemyDamage: [4, 9],
    readyOffsets: {
      scout: 900,
      enemy0: 650,
      enemy1: 1_400,
    },
    casting: {
      arcanist: { abilityId: 'fireball', remainingMs: 500 },
      enemy0: { abilityId: 'slash', remainingMs: 250 },
    },
  }),
};

export const EliteRaid: Story = {
  args: buildBattleScenario({
    started: true,
    partyDamage: [12, 18, 7],
    enemyDamage: [15, 8, 3],
    enemyNames: ['Marauder Captain', 'Raider Mage', 'Raider Hound'],
    enemyTiers: [4, 4, 3],
    eliteEnemyIds: ['enemy0'],
    coord: { q: 4, r: -2 },
    readyOffsets: {
      vanguard: 450,
      arcanist: 1_250,
      enemy0: 1_100,
      enemy1: 250,
      enemy2: 800,
    },
  }),
};

export const LegendaryRaid: Story = {
  args: buildBattleScenario({
    started: true,
    partyDamage: [14, 9, 16],
    enemyDamage: [8, 5, 0],
    enemyNames: ['Warden of Ash', 'Rift Howler', 'Shardbound Raider'],
    enemyTiers: [5, 4, 4],
    enemyRarities: ['legendary', 'epic', 'rare'],
    coord: { q: 5, r: -3 },
    readyOffsets: {
      vanguard: 600,
      arcanist: 350,
      enemy0: 1_300,
      enemy1: 500,
      enemy2: 900,
    },
  }),
};

export const EnemyStatTooltipPreview: Story = {
  args: buildBattleScenario({
    started: true,
    enemyNames: ['Wolf'],
    enemyTiers: [2],
    enemyDamage: [4],
    enemyStatusEffects: [
      [
        { id: 'power', value: 10 },
        { id: 'guard', value: 15 },
        { id: 'frenzy', value: 20 },
      ],
    ],
    readyOffsets: {
      enemy0: 500,
    },
  }),
};

function CombatWindowStory(args: CombatWindowProps) {
  const [combat, setCombat] = useState(args.combat);

  useEffect(() => {
    setCombat(args.combat);
  }, [args.combat]);

  return (
    <CombatWindow
      {...args}
      combat={combat}
      onStart={() => {
        args.onStart();
        setCombat((current) => ({
          ...current,
          started: true,
        }));
      }}
    />
  );
}

async function waitForButton(
  canvasElement: HTMLElement,
  label: string,
): Promise<HTMLButtonElement> {
  const timeoutMs = 2_000;
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const buttons = Array.from(canvasElement.querySelectorAll('button'));
      const match = buttons.find((button): button is HTMLButtonElement =>
        button.textContent?.includes(label),
      );
      if (match) {
        resolve(match);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Timed out waiting for button: ${label}`));
        return;
      }
      window.requestAnimationFrame(check);
    };

    check();
  });
}

function buildBattleScenario({
  started,
  coord = { q: 2, r: -1 },
  partyDamage = [0, 0, 0],
  enemyDamage = [0, 0],
  enemyNames = ['Wolf', 'Raider'],
  enemyTiers = [2, 2],
  eliteEnemyIds = [],
  enemyRarities = [],
  enemyStatusEffects = [],
  readyOffsets = {},
  casting = {},
}: {
  started: boolean;
  coord?: CombatState['coord'];
  partyDamage?: number[];
  enemyDamage?: number[];
  enemyNames?: string[];
  enemyTiers?: number[];
  eliteEnemyIds?: string[];
  enemyRarities?: Array<Enemy['rarity']>;
  enemyStatusEffects?: Array<Enemy['statusEffects']>;
  readyOffsets?: Partial<Record<string, number>>;
  casting?: Partial<Record<string, { abilityId: string; remainingMs: number }>>;
}) {
  const playerParty: CombatPartyMember[] = [
    buildPartyMember(
      'vanguard',
      'Vanguard',
      7,
      42,
      14,
      partyDamage[0] ?? 0,
      readyOffsets,
      casting,
    ),
    buildPartyMember(
      'scout',
      'Scout',
      6,
      28,
      20,
      partyDamage[1] ?? 0,
      readyOffsets,
      casting,
    ),
    buildPartyMember(
      'arcanist',
      'Arcanist',
      6,
      24,
      32,
      partyDamage[2] ?? 0,
      readyOffsets,
      casting,
    ),
  ];

  const enemies: Enemy[] = enemyNames.map((name, index) => {
    const id = `enemy${index}`;
    const maxHp = index === 0 ? 34 : 26;
    const tier = enemyTiers[index] ?? 2;
    const rarity =
      enemyRarities[index] ?? (eliteEnemyIds.includes(id) ? 'rare' : 'common');
    const elite =
      eliteEnemyIds.includes(id) ||
      rarity === 'rare' ||
      rarity === 'epic' ||
      rarity === 'legendary';
    return {
      id,
      name,
      coord,
      rarity,
      tier,
      baseMaxHp: maxHp,
      hp: Math.max(1, maxHp - (enemyDamage[index] ?? 0)),
      maxHp,
      baseAttack: elite ? 9 : 6,
      attack: elite ? 9 : 6,
      baseDefense: elite ? 6 : 3,
      defense: elite ? 6 : 3,
      xp: elite ? 120 : 64,
      elite,
      statusEffects: enemyStatusEffects[index],
    };
  });

  const combatEnemies = Object.fromEntries(
    enemies.map((enemy) => [
      enemy.id,
      buildActor(enemy.id, readyOffsets[enemy.id], casting[enemy.id]),
    ]),
  );

  const combat: CombatState = {
    coord,
    enemyIds: enemies.map((enemy) => enemy.id),
    started,
    player: buildActor('player', 0, casting.player),
    enemies: combatEnemies,
  };

  return {
    combat,
    playerParty,
    enemies,
  };
}

function buildPartyMember(
  id: string,
  name: string,
  level: number,
  maxHp: number,
  maxMana: number,
  damageTaken: number,
  readyOffsets: Partial<Record<string, number>>,
  casting: Partial<Record<string, { abilityId: string; remainingMs: number }>>,
): CombatPartyMember {
  return {
    id,
    name,
    level,
    hp: Math.max(1, maxHp - damageTaken),
    maxHp,
    mana: maxMana,
    maxMana,
    attack: id === 'arcanist' ? 11 : id === 'scout' ? 8 : 10,
    actor: buildActor(id, readyOffsets[id], casting[id]),
    buffs: [],
    debuffs: [],
  };
}

function buildActor(
  id: string,
  readyInMs = 0,
  casting?: { abilityId: string; remainingMs: number },
): CombatActorState {
  const actor = createCombatActorState(
    WORLD_TIME_MS,
    casting ? [casting.abilityId, 'kick'] : undefined,
  );
  actor.globalCooldownEndsAt = WORLD_TIME_MS + Math.max(0, readyInMs);
  actor.cooldownEndsAt.kick = WORLD_TIME_MS + Math.max(0, readyInMs);
  if (id === 'arcanist') {
    actor.globalCooldownMs = 2_000;
  }
  if (casting) {
    const ability = getAbilityDefinition(casting.abilityId);
    actor.casting = {
      abilityId: casting.abilityId,
      targetId: 'player',
      endsAt: WORLD_TIME_MS + Math.max(1, casting.remainingMs),
    };
    actor.cooldownEndsAt[casting.abilityId] =
      actor.casting.endsAt + ability.cooldownMs;
  }
  return actor;
}
