import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  buildItemFromConfig,
  getItemConfigByKey,
} from '../../../game/content/items';
import { ItemId } from '../../../game/content/ids';
import { makeRecipePage } from '../../../game/inventory';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { InventoryWindow } from './InventoryWindow';
import { createRecipe } from '../../uiRecipeBookTestHelpers';

const fixtures = createStorybookFixtures();
const noopHoverItem: NonNullable<
  ComponentProps<typeof InventoryWindow>['onHoverItem']
> = noop;
const noopContextItem: NonNullable<
  ComponentProps<typeof InventoryWindow>['onContextItem']
> = noop;

const meta = {
  title: 'Windows/Inventory',
  component: InventoryWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    inventory: fixtures.inventory,
    equipment: fixtures.equipment,
    learnedRecipeIds: [],
    onSort: noop,
    onActivateItem: noop,
    onSellItem: noop,
    onContextItem: noopContextItem,
    onHoverItem: noopHoverItem,
    onLeaveItem: noop,
  },
  parameters: {
    controls: {
      exclude: [
        'onMove',
        'onClose',
        'onSort',
        'onActivateItem',
        'onContextItem',
        'onHoverItem',
        'onLeaveItem',
      ],
    },
  },
} satisfies Meta<typeof InventoryWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PackedInventory: Story = {};

export const SortMenuOpen: Story = {
  play: async ({ canvasElement }) => {
    const sortButton = Array.from(
      canvasElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Sort'));
    sortButton?.click();
  },
};

export const MixedCategories: Story = {
  args: {
    inventory: [
      buildItemFromConfig(ItemId.TownKnife, { id: 'story-knife' }),
      buildItemFromConfig(ItemId.TrailRation, { id: 'story-ration' }),
      buildItemFromConfig(ItemId.Cloth, { id: 'story-cloth', quantity: 3 }),
      buildItemFromConfig(ItemId.Gold, { id: 'story-gold', quantity: 12 }),
      buildItemFromConfig(ItemId.Stone, { id: 'story-stone', quantity: 2 }),
      makeRecipePage(
        createRecipe({
          id: 'story-camp-spear',
          name: 'Camp Spear',
          output: {
            id: 'story-crafted-camp-spear',
            itemKey: ItemId.CampSpear,
            icon: getItemConfigByKey(ItemId.CampSpear)?.icon,
            name: 'Camp Spear',
            power: 3,
          },
        }),
      ),
    ],
    learnedRecipeIds: [],
  },
};

export const LearnedRecipes: Story = {
  args: {
    learnedRecipeIds: fixtures.inventory
      .filter((item) => item.recipeId)
      .map((item) => item.recipeId as string),
  },
};
