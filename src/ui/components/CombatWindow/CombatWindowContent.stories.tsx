import type { Meta, StoryObj } from '@storybook/react-vite';
import { createCombatActorState } from '../../../game/combat';
import type { CombatActorState, CombatState, Enemy } from '../../../game/types';
import { CombatWindowContent } from './CombatWindowContent';
import type { CombatPartyMember, CombatWindowProps } from './types';

const WORLD_TIME_MS = 12_000;
const noopHoverDetail: CombatWindowProps['onHoverDetail'] = () => undefined;
const noopLeaveDetail: CombatWindowProps['onLeaveDetail'] = () => undefined;
const noopStart = () => undefined;

const meta = {
  title: 'Windows/Combat/Content',
  component: CombatWindowContent,
  decorators: [
    (Story) => (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ width: 'min(920px, calc(100vw - 48px))' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    worldTimeMs: WORLD_TIME_MS,
    onStart: noopStart,
    onHoverDetail: noopHoverDetail,
    onLeaveDetail: noopLeaveDetail,
  },
  parameters: {
    controls: {
      exclude: ['onStart', 'onHoverDetail', 'onLeaveDetail'],
    },
  },
} satisfies Meta<typeof CombatWindowContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EncounterWaitingForStart: Story = {
  args: buildBattleScenario({ started: false }),
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

function buildBattleScenario({
  started,
  coord = { q: 2, r: -1 },
  partyDamage = [0, 0, 0],
  enemyDamage = [0, 0],
  enemyNames = ['Wolf', 'Raider'],
  enemyTiers = [2, 2],
  eliteEnemyIds = [],
  readyOffsets = {},
}: {
  started: boolean;
  coord?: CombatState['coord'];
  partyDamage?: number[];
  enemyDamage?: number[];
  enemyNames?: string[];
  enemyTiers?: number[];
  eliteEnemyIds?: string[];
  readyOffsets?: Partial<Record<string, number>>;
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
    ),
    buildPartyMember(
      'scout',
      'Scout',
      6,
      28,
      20,
      partyDamage[1] ?? 0,
      readyOffsets,
    ),
    buildPartyMember(
      'arcanist',
      'Arcanist',
      6,
      24,
      32,
      partyDamage[2] ?? 0,
      readyOffsets,
    ),
  ];

  const enemies: Enemy[] = enemyNames.map((name, index) => {
    const id = `enemy${index}`;
    const maxHp = index === 0 ? 34 : 26;
    const tier = enemyTiers[index] ?? 2;
    const elite = eliteEnemyIds.includes(id);
    return {
      id,
      name,
      coord,
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
    };
  });

  const combatEnemies = Object.fromEntries(
    enemies.map((enemy) => [
      enemy.id,
      buildActor(enemy.id, readyOffsets[enemy.id]),
    ]),
  );

  const combat: CombatState = {
    coord,
    enemyIds: enemies.map((enemy) => enemy.id),
    started,
    player: buildActor('player', 0),
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
): CombatPartyMember {
  return {
    id,
    name,
    level,
    hp: Math.max(1, maxHp - damageTaken),
    maxHp,
    mana: maxMana,
    maxMana,
    actor: buildActor(id, readyOffsets[id]),
  };
}

function buildActor(id: string, readyInMs = 0): CombatActorState {
  const actor = createCombatActorState(WORLD_TIME_MS);
  actor.globalCooldownEndsAt = WORLD_TIME_MS + Math.max(0, readyInMs);
  actor.cooldownEndsAt.kick = WORLD_TIME_MS + Math.max(0, readyInMs);
  if (id === 'arcanist') {
    actor.globalCooldownMs = 2_000;
  }
  return actor;
}
