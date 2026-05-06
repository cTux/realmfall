import type { Meta, StoryObj } from '@storybook/react-vite';
import { GameTag } from '../../game/content/tags';
import type { ItemView } from '../../game/stateTypes';
import { noop, storySurfaceDecorator } from '../storybook/storybookHelpers';
import { ItemContextMenu } from './ItemContextMenu';

const equippableItem = createStoryItem({
  id: 'storybook-scout-hood',
  itemKey: 'scout-hood',
  name: 'Scout Hood',
  slot: 'head',
  rarity: 'uncommon',
  defense: 4,
  tags: [GameTag.ItemArmor, GameTag.ItemEquipment],
});

const consumableItem = createStoryItem({
  id: 'storybook-trail-ration',
  itemKey: 'trail-ration',
  name: 'Trail Ration',
  quantity: 3,
  hunger: 12,
  tags: [GameTag.ItemConsumable, GameTag.ItemFood, GameTag.ItemStackable],
});

const meta = {
  title: 'Components/ContextMenu',
  component: ItemContextMenu,
  decorators: [storySurfaceDecorator],
  args: {
    item: equippableItem,
    x: 120,
    y: 80,
    canEquip: true,
    canUse: false,
    onEquip: noop,
    onUse: noop,
    onDrop: noop,
    onClose: noop,
  },
} satisfies Meta<typeof ItemContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Equippable: Story = {};

export const Consumable: Story = {
  args: {
    item: consumableItem,
    canEquip: false,
    canUse: true,
  },
};

export const ForgeAction: Story = {
  args: {
    canEquip: true,
    canProspectItem: true,
    onProspect: noop,
  },
};

export const RuneForgeAction: Story = {
  args: {
    canEquip: true,
    reforgeOptions: [
      {
        cost: 74,
        label: 'Attack Speed',
        statIndex: 0,
      },
      {
        cost: 74,
        label: 'Dodge Chance',
        statIndex: 1,
      },
    ],
    onReforge: noop,
  },
};

export const ManaFontAction: Story = {
  args: {
    canEquip: true,
    enchantCost: 96,
    onEnchant: noop,
  },
};

export const CorruptionAltarAction: Story = {
  args: {
    canEquip: true,
    corruptCost: 132,
    corruptBreakChancePercent: 5,
    onCorrupt: noop,
  },
};

export const TownAction: Story = {
  args: {
    canEquip: true,
    canSellEntry: true,
    onSell: noop,
  },
};

function createStoryItem(overrides: Partial<ItemView>): ItemView {
  return {
    id: 'storybook-item',
    name: 'Storybook Item',
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
    ...overrides,
  };
}
