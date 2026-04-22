import type { Meta, StoryObj } from '@storybook/react-vite';
import { getItemCategory } from '../../../game/content/items';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ItemContextMenu } from './ItemContextMenu';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/Item Context Menu',
  component: ItemContextMenu,
  decorators: [storySurfaceDecorator],
  args: {
    item: fixtures.inventory[0],
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
    item:
      fixtures.inventory.find(
        (item) => getItemCategory(item) === 'consumable',
      ) ?? fixtures.inventory[0],
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
        key: 'attackSpeed',
        statIndex: 0,
      },
      {
        cost: 74,
        key: 'dodgeChance',
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
