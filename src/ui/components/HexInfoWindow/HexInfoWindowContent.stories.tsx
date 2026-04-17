import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildItemFromConfig } from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import {
  describeStructure,
  structureActionLabel,
  structureDefinition,
} from '../../../game/world';
import type { StructureType } from '../../../game/types';
import { HexInfoWindowContent } from './HexInfoWindowContent';
import type { HexInfoWindowProps } from './types';

const noopBuyItem: HexInfoWindowProps['onBuyItem'] = () => undefined;
const noopHoverItem: HexInfoWindowProps['onHoverItem'] = () => undefined;
const noopLeaveItem: HexInfoWindowProps['onLeaveItem'] = () => undefined;
const noopAction = () => undefined;

const meta = {
  title: 'Windows/Hex Info/Structures',
  component: HexInfoWindowContent,
  decorators: [
    (Story) => (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ width: 'min(420px, calc(100vw - 48px))' }}>
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
    gold: 48,
    townStock: [
      {
        item: buildItemFromConfig(ItemId.TownKnife, {
          id: 'iron-sword',
          tier: 2,
        }),
        price: 18,
      },
      {
        item: buildItemFromConfig(ItemId.TrailRation, { id: 'travel-ration' }),
        price: 6,
      },
      {
        item: buildItemFromConfig(ItemId.CopperLoop, {
          id: 'amber-charm',
          tier: 2,
          name: 'Amber Charm',
        }),
        price: 28,
      },
    ],
  }),
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
  | 'onHoverItem'
  | 'onLeaveItem'
>;
