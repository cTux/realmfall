import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createCombatActorState } from '../../../game/combat';
import { buildItemFromConfig } from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { buildTownStock } from '../../../game/economy';
import {
  describeStructure,
  structureActionLabel,
  structureDefinition,
} from '../../../game/world';
import type { CombatState, StructureType } from '../../../game/types';
import { HexInfoWindowContent } from './HexInfoWindowContent';
import type { HexInfoWindowProps } from './types';

const noopBuyItem: HexInfoWindowProps['onBuyItem'] = () => undefined;
const noopHoverItem: HexInfoWindowProps['onHoverItem'] = () => undefined;
const noopLeaveItem: HexInfoWindowProps['onLeaveItem'] = () => undefined;
const noopAction = () => undefined;

const meta = {
  title: 'Windows/Hex Content/States',
  component: HexInfoWindowContent,
  decorators: [
    (Story) => (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ width: 'min(720px, calc(100vw - 48px))' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    onInteract: noopAction,
    onTerritoryAction: noopAction,
    onProspect: noopAction,
    onSellAll: noopAction,
    onBuyItem: noopBuyItem,
    onTakeAll: noopAction,
    onTakeItem: noopBuyItem,
    onHoverItem: noopHoverItem,
    onLeaveItem: noopLeaveItem,
  },
  parameters: {
    controls: {
      exclude: [
        'onInteract',
        'onTerritoryAction',
        'onProspect',
        'onSellAll',
        'onBuyItem',
        'onTakeAll',
        'onTakeItem',
        'onHoverItem',
        'onLeaveItem',
      ],
    },
  },
} satisfies Meta<typeof HexInfoWindowContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Forge: Story = {
  args: buildStructureArgs('forge', {
    terrain: 'Mountain',
    canProspectInventoryEquipment: true,
  }),
};

export const Camp: Story = {
  args: buildStructureArgs('camp', {
    terrain: 'Forest',
  }),
};

export const Workshop: Story = {
  args: buildStructureArgs('workshop', {
    terrain: 'Plains',
  }),
};

export const Town: Story = {
  args: buildStructureArgs('town', {
    terrain: 'Plains',
    canSellInventoryEquipment: true,
    gold: 240,
    townStock: buildTownStock('storybook-town', { q: 0, r: 0 }),
    loot: [
      buildItemFromConfig(ItemId.Gold, { id: 'ground-gold', quantity: 14 }),
      buildItemFromConfig(ItemId.TownKnife, { id: 'ground-knife', tier: 2 }),
    ],
  }),
};

export const CombatEncounter: Story = {
  args: {
    ...buildStructureArgs('dungeon', {
      terrain: 'Rift',
      enemyCount: 2,
      canTerritoryAction: false,
      territoryActionLabel: 'Claim hex',
    }),
    combat: buildCombatState(),
    combatPlayerParty: [
      {
        id: 'player',
        name: 'Player',
        level: 7,
        hp: 38,
        maxHp: 42,
        mana: 15,
        maxMana: 18,
        attack: 12,
        actor: createCombatActorState(12_000, ['kick']),
        buffs: [],
        debuffs: [],
      },
    ],
    combatEnemies: [
      {
        id: 'enemy-1',
        name: 'Raider',
        coord: { q: 1, r: 0 },
        rarity: 'rare',
        tier: 4,
        hp: 24,
        maxHp: 30,
        attack: 10,
        defense: 6,
        xp: 24,
        elite: true,
        abilityIds: ['kick'],
      },
      {
        id: 'enemy-2',
        name: 'Wolf',
        coord: { q: 1, r: 0 },
        rarity: 'common',
        tier: 3,
        hp: 18,
        maxHp: 22,
        attack: 8,
        defense: 4,
        xp: 18,
        elite: false,
        abilityIds: ['kick'],
      },
    ],
    loot: [
      buildItemFromConfig(ItemId.Gold, { id: 'combat-gold', quantity: 22 }),
      buildItemFromConfig(ItemId.HideBuckler, {
        id: 'combat-buckler',
        tier: 3,
      }),
    ],
  },
};

export const Dungeon: Story = {
  args: buildStructureArgs('dungeon', {
    terrain: 'Rift',
    enemyCount: 2,
  }),
};

export const Tree: Story = {
  args: buildGatheringStructureArgs('tree', {
    terrain: 'Forest',
    enemyCount: 0,
  }),
};

export const CopperVein: Story = {
  args: buildGatheringStructureArgs('copper-ore', {
    terrain: 'Mountain',
    enemyCount: 0,
  }),
};

export const IronVein: Story = {
  args: buildGatheringStructureArgs('iron-ore', {
    terrain: 'Mountain',
    enemyCount: 1,
  }),
};

export const CoalSeam: Story = {
  args: buildGatheringStructureArgs('coal-ore', {
    terrain: 'Mountain',
    enemyCount: 0,
  }),
};

export const Pond: Story = {
  args: buildGatheringStructureArgs('pond', {
    terrain: 'Swamp',
    enemyCount: 0,
  }),
};

export const Lake: Story = {
  args: buildGatheringStructureArgs('lake', {
    terrain: 'Swamp',
    enemyCount: 0,
  }),
};

function buildStructureArgs(
  structure: StructureType,
  overrides: Partial<StoryArgs>,
): StoryArgs {
  return {
    terrain: overrides.terrain ?? 'Plains',
    structure: describeStructure(structure),
    enemyCount: overrides.enemyCount ?? (structure === 'dungeon' ? 2 : 0),
    interactLabel: overrides.interactLabel ?? structureActionLabel(structure),
    canInteract: overrides.canInteract ?? false,
    canTerritoryAction: overrides.canTerritoryAction ?? true,
    territoryActionLabel: overrides.territoryActionLabel ?? 'Claim hex',
    canProspectInventoryEquipment:
      overrides.canProspectInventoryEquipment ?? false,
    canSellInventoryEquipment: overrides.canSellInventoryEquipment ?? false,
    territoryActionExplanation: overrides.territoryActionExplanation ?? null,
    prospectInventoryEquipmentExplanation:
      overrides.prospectInventoryEquipmentExplanation ?? null,
    sellInventoryEquipmentExplanation:
      overrides.sellInventoryEquipmentExplanation ?? null,
    structureHp: overrides.structureHp,
    structureMaxHp: overrides.structureMaxHp,
    territoryName: overrides.territoryName ?? null,
    territoryOwnerType: overrides.territoryOwnerType ?? null,
    territoryNpc: overrides.territoryNpc ?? null,
    townStock: overrides.townStock ?? [],
    gold: overrides.gold ?? 0,
    loot: overrides.loot ?? [],
  };
}

function buildGatheringStructureArgs(
  structure: Extract<
    StructureType,
    'tree' | 'copper-ore' | 'iron-ore' | 'coal-ore' | 'pond' | 'lake'
  >,
  overrides: Partial<StoryArgs>,
): StoryArgs {
  const definition = structureDefinition(structure);

  return buildStructureArgs(structure, {
    ...overrides,
    canInteract: true,
    interactLabel: structureActionLabel(structure),
    structureHp: overrides.structureHp ?? Math.max(1, definition.maxHp - 2),
    structureMaxHp: overrides.structureMaxHp ?? definition.maxHp,
  });
}

type StoryArgs = Omit<
  ComponentProps<typeof HexInfoWindowContent>,
  | 'onInteract'
  | 'onTerritoryAction'
  | 'onProspect'
  | 'onSellAll'
  | 'onBuyItem'
  | 'onTakeAll'
  | 'onTakeItem'
  | 'onHoverItem'
  | 'onLeaveItem'
>;

function buildCombatState(): CombatState {
  return {
    coord: { q: 1, r: 0 },
    enemyIds: ['enemy-1', 'enemy-2'],
    started: false,
    player: createCombatActorState(12_000, ['kick']),
    enemies: {
      'enemy-1': createCombatActorState(12_000, ['kick']),
      'enemy-2': createCombatActorState(12_000, ['kick']),
    },
  };
}
