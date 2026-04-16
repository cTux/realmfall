import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { InventoryWindow } from './InventoryWindow';

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
    onEquip: noop,
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
        'onEquip',
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

export const LearnedRecipes: Story = {
  args: {
    learnedRecipeIds: fixtures.inventory
      .filter((item) => item.recipeId)
      .map((item) => item.recipeId as string),
  },
};
