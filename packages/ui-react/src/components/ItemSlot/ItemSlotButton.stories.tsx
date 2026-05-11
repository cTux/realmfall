import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { EquipmentSlotId } from '../../game/content/ids';
import { GameTag } from '../../game/content/tags';
import type { ItemView } from '../../game/stateTypes';
import { noop, storySurfaceDecorator } from '../storybook/storybookHelpers';
import { ItemSlotButton } from './ItemSlotButton';

const filledItem = createStoryItem({
  id: 'storybook-camp-spear',
  itemKey: 'camp-spear',
  name: 'Camp Spear',
  slot: EquipmentSlotId.Weapon,
  rarity: 'rare',
  power: 6,
  tags: [GameTag.ItemWeapon, GameTag.ItemEquipment],
});

const stormBlade = createStoryItem({
  id: 'storybook-storm-blade',
  itemKey: 'storm-blade',
  name: 'Storm Blade',
  slot: EquipmentSlotId.Weapon,
  rarity: 'rare',
  power: 12,
  tags: [GameTag.ItemWeapon, GameTag.ItemEquipment],
});

const ashenCloak = createStoryItem({
  id: 'storybook-ashen-cloak',
  itemKey: 'ashen-cloak',
  name: 'Ashen Cloak',
  slot: EquipmentSlotId.Cloak,
  rarity: 'uncommon',
  maxHp: 18,
  tags: [GameTag.ItemArtifact, GameTag.ItemEquipment],
});

const voidCharm = createStoryItem({
  id: 'storybook-void-charm',
  itemKey: 'void-charm',
  name: 'Void Charm',
  slot: EquipmentSlotId.Relic,
  rarity: 'epic',
  power: 4,
  maxHp: 10,
  tags: [GameTag.ItemArtifact, GameTag.ItemEquipment],
});

const meta = {
  title: 'Components/ItemSlot',
  component: ItemSlotButton,
  decorators: [storySurfaceDecorator],
  args: {
    item: filledItem,
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
  parameters: {
    docs: {
      description: {
        story:
          'Occupied slots render a subtle edge-wash inset gradient that reuses the exact border color value.',
      },
    },
  },
  render: (args: ComponentProps<typeof ItemSlotButton>) => (
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
    item: createStoryItem({
      id: 'storybook-recipe-page',
      itemKey: 'recipe-book',
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      rarity: 'uncommon',
    }),
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
