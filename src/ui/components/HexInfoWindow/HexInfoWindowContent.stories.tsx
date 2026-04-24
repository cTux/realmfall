import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { setWorldClockTime } from '../../../app/App/worldClockStore';
import { createCombatActorState } from '../../../game/combat';
import { buildItemFromConfig } from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { buildTownStock } from '../../../game/economy';
import { getItemModificationCost } from '../../../game/itemModifications';
import {
  describeStructure,
  describeStructureDescription,
  structureActionLabel,
  structureDefinition,
} from '../../../game/world';
import type { CombatState, StructureType } from '../../../game/types';
import { HexInfoWindowContent } from './HexInfoWindowContent';
import type { HexInfoWindowProps } from './types';

const noopBuyItem: HexInfoWindowProps['onBuyItem'] = () => undefined;
const noopHoverItem: HexInfoWindowProps['onHoverItem'] = () => undefined;
const noopLeaveItem: HexInfoWindowProps['onLeaveItem'] = () => undefined;
const noopAction: () => void = () => {};

const meta = {
  title: 'Windows/Hex Content/States',
  component: HexInfoWindowContent,
  decorators: [
    (Story, context) => {
      setWorldClockTime(context.parameters.worldTimeMs ?? 0);

      return (
        <div style={{ padding: '24px', minHeight: '100vh' }}>
          <div style={{ width: 'min(720px, calc(100vw - 48px))' }}>
            <Story />
          </div>
        </div>
      );
    },
  ],
  args: {
    onInteract: noopAction,
    onTerritoryAction: noopAction,
    onHealTerritoryNpc: noopAction,
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
        'onHealTerritoryNpc',
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

export const EmptyPlains: Story = {
  args: {
    terrain: 'Plains',
    structure: null,
    hexDescription: 'A clear stretch of wind-scraped shardland.',
    enemyCount: 0,
    interactLabel: null,
    canInteract: false,
    canTerritoryAction: false,
    territoryActionLabel: 'Cl(a)im',
    canHealTerritoryNpc: false,
    territoryNpcHealExplanation: null,
    canBulkProspectEquipment: false,
    canBulkSellEquipment: false,
    itemModification: null,
    territoryActionExplanation: null,
    bulkProspectEquipmentExplanation: null,
    bulkSellEquipmentExplanation: null,
    territoryName: null,
    territoryOwnerType: null,
    territoryNpc: null,
    townStock: [],
    gold: 0,
    loot: [],
  },
};

export const Forge: Story = {
  args: buildStructureArgs('forge', {
    terrain: 'Mountain',
    canBulkProspectEquipment: true,
  }),
};

export const RuneForge: Story = {
  args: buildStructureArgs('rune-forge', {
    terrain: 'Mountain',
    itemModification: buildItemModificationStoryArgs('reforge'),
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

export const ManaFont: Story = {
  args: buildStructureArgs('mana-font', {
    terrain: 'Rift',
    itemModification: buildItemModificationStoryArgs('enchant'),
  }),
};

export const Town: Story = {
  args: buildStructureArgs('town', {
    terrain: 'Plains',
    canBulkSellEquipment: true,
    gold: 240,
    townStock: buildTownStock('storybook-town', { q: 0, r: 0 }),
    loot: [
      buildItemFromConfig(ItemId.Gold, { id: 'ground-gold', quantity: 14 }),
      buildItemFromConfig(ItemId.TownKnife, { id: 'ground-knife', tier: 2 }),
    ],
  }),
};

export const TownWithoutSellables: Story = {
  args: buildStructureArgs('town', {
    terrain: 'Plains',
    bulkSellEquipmentExplanation: 'No equippable items to sell.',
    gold: 240,
    townStock: buildTownStock('storybook-town-empty-sell', { q: 0, r: 0 }),
  }),
};

export const FactionNpc: Story = {
  args: buildStructureArgs('camp', {
    terrain: 'Plains',
    territoryName: 'Ghostline',
    territoryOwnerType: 'faction',
    territoryNpc: { name: 'Araken' },
    canHealTerritoryNpc: true,
  }),
};

export const CombatEncounter: Story = {
  args: {
    ...buildStructureArgs('dungeon', {
      terrain: 'Rift',
      enemyCount: 2,
      canTerritoryAction: false,
      territoryActionLabel: 'Cl(a)im',
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
  parameters: {
    worldTimeMs: 12_000,
  },
};

export const LongCombatEncounter: Story = {
  args: {
    ...CombatEncounter.args,
    combat: buildCombatState({ started: true, startedAtMs: 0 }),
  },
  parameters: {
    worldTimeMs: 61_000,
  },
};

export const Dungeon: Story = {
  args: buildStructureArgs('dungeon', {
    terrain: 'Rift',
    enemyCount: 2,
  }),
};

export const CorruptionAltar: Story = {
  args: buildStructureArgs('corruption-altar', {
    terrain: 'Rift',
    itemModification: buildItemModificationStoryArgs('corrupt'),
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
    hexDescription:
      overrides.hexDescription ??
      describeStructureDescription(structure) ??
      'A clear stretch of wind-scraped shardland.',
    enemyCount: overrides.enemyCount ?? (structure === 'dungeon' ? 2 : 0),
    interactLabel: overrides.interactLabel ?? structureActionLabel(structure),
    canInteract: overrides.canInteract ?? false,
    canTerritoryAction: overrides.canTerritoryAction ?? true,
    territoryActionLabel: overrides.territoryActionLabel ?? 'Cl(a)im',
    canHealTerritoryNpc: overrides.canHealTerritoryNpc ?? false,
    territoryNpcHealExplanation: overrides.territoryNpcHealExplanation ?? null,
    canBulkProspectEquipment: overrides.canBulkProspectEquipment ?? false,
    canBulkSellEquipment: overrides.canBulkSellEquipment ?? false,
    itemModification: overrides.itemModification ?? null,
    territoryActionExplanation: overrides.territoryActionExplanation ?? null,
    bulkProspectEquipmentExplanation:
      overrides.bulkProspectEquipmentExplanation ?? null,
    bulkSellEquipmentExplanation:
      overrides.bulkSellEquipmentExplanation ?? null,
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

function buildItemModificationStoryArgs(
  kind: 'reforge' | 'enchant' | 'corrupt',
) {
  const selectedItem = buildItemFromConfig(ItemId.TownKnife, {
    id: `hex-mod-${kind}`,
    tier: 6,
    rarity: 'rare',
    secondaryStatCapacity: 2,
    secondaryStats: [
      { key: 'attackSpeed', value: 4 },
      { key: 'dodgeChance', value: 3 },
    ],
  });

  return {
    kind,
    hint: `Storybook ${kind} hint`,
    pickerActive: false,
    selectedItem,
    actionCost: getItemModificationCost(selectedItem, kind),
    canAfford: true,
    canApply: true,
    disabledReason: null,
    reforgeOptions:
      kind === 'reforge'
        ? [
            { label: 'Attack Speed', statIndex: 0 },
            { label: 'Dodge Chance', statIndex: 1 },
          ]
        : [],
    selectedReforgeStatIndex: kind === 'reforge' ? 0 : null,
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
  | 'onHealTerritoryNpc'
  | 'onProspect'
  | 'onSellAll'
  | 'onBuyItem'
  | 'onTakeAll'
  | 'onTakeItem'
  | 'onHoverItem'
  | 'onLeaveItem'
>;

function buildCombatState({
  started = false,
  startedAtMs,
}: {
  started?: boolean;
  startedAtMs?: number;
} = {}): CombatState {
  return {
    coord: { q: 1, r: 0 },
    enemyIds: ['enemy-1', 'enemy-2'],
    started,
    startedAtMs,
    player: createCombatActorState(12_000, ['kick']),
    enemies: {
      'enemy-1': createCombatActorState(12_000, ['kick']),
      'enemy-2': createCombatActorState(12_000, ['kick']),
    },
  };
}
