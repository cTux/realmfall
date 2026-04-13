import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  describeStructure,
  structureActionLabel,
  structureDefinition,
} from '../../../game/world';
import type { Item, StructureType } from '../../../game/types';
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
    canProspect: true,
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
    canSell: true,
    gold: 48,
    townStock: [
      { item: makeItem('iron-sword', 'weapon', 'Iron Sword', 2), price: 18 },
      {
        item: makeItem('travel-ration', 'consumable', 'Travel Ration', 1),
        price: 6,
      },
      {
        item: makeItem('amber-charm', 'artifact', 'Amber Charm', 2),
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
    canProspect: overrides.canProspect ?? false,
    canSell: overrides.canSell ?? false,
    prospectExplanation: overrides.prospectExplanation ?? null,
    sellExplanation: overrides.sellExplanation ?? null,
    structureHp: overrides.structureHp,
    structureMaxHp: overrides.structureMaxHp,
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

function makeItem(
  id: string,
  kind: Item['kind'],
  name: string,
  tier: number,
): Item {
  return {
    id,
    kind,
    name,
    quantity: 1,
    tier,
    rarity: tier >= 2 ? 'uncommon' : 'common',
    power: kind === 'weapon' || kind === 'artifact' ? tier * 3 : 0,
    defense: kind === 'armor' ? tier * 2 : 0,
    maxHp: kind === 'artifact' ? tier * 4 : 0,
    healing: kind === 'consumable' ? 14 : 0,
    hunger: kind === 'consumable' ? 10 : 0,
  };
}

type StoryArgs = Omit<
  ComponentProps<typeof HexInfoWindowContent>,
  | 'onInteract'
  | 'onProspect'
  | 'onSellAll'
  | 'onBuyItem'
  | 'onHoverItem'
  | 'onLeaveItem'
>;
