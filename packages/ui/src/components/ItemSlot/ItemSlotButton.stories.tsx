import type { Meta, StoryObj } from '@storybook/react-vite';
import { EquipmentSlotId, ItemId } from '../../game/content/ids';
import { buildItemFromConfig } from '../../game/content/items';
import { GameTag } from '../../game/content/tags';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ItemSlotButton } from './ItemSlotButton';

const fixtures = createStorybookFixtures();
const filledItem =
  fixtures.inventory.find((item) => item.slot) ?? fixtures.inventory[0];
const stormBlade = buildItemFromConfig('storm-blade', {
  id: 'storybook-storm-blade',
  rarity: 'rare',
});
const ashenCloak = buildItemFromConfig('ashen-cloak', {
  id: 'storybook-ashen-cloak',
  rarity: 'uncommon',
});
const voidCharm = buildItemFromConfig('void-charm', {
  id: 'storybook-void-charm',
  rarity: 'epic',
});

const meta = {
  title: 'Components/ItemSlot',
  component: ItemSlotButton,
  decorators: [storySurfaceDecorator],
  args: {
    item: filledItem
      ? { ...filledItem, rarity: 'rare' }
      : fixtures.inventory[0],
    onClick: noop,
    onContextMenu: noop,
    onMouseEnter: noop,
    onMouseLeave: noop,
  },
  parameters: {
    controls: {
      exclude: ['onClick', 'onContextMenu', 'onMouseEnter', 'onMouseLeave'],
    },
  },
} satisfies Meta<typeof ItemSlotButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const CompactFilled: Story = {
  args: {
    size: 'compact',
  },
};

export const ThemeFirstEquippables: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ItemSlotButton {...args} item={stormBlade} size="compact" />
      <ItemSlotButton {...args} item={ashenCloak} size="compact" />
      <ItemSlotButton {...args} item={voidCharm} size="compact" />
    </div>
  ),
};

export const EmptyEquipmentSlot: Story = {
  args: {
    item: undefined,
    slot: EquipmentSlotId.Head,
  },
};

export const RecipePage: Story = {
  args: {
    size: 'compact',
    item: {
      id: 'storybook-recipe-page',
      itemKey: ItemId.RecipeBook,
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
  },
};
