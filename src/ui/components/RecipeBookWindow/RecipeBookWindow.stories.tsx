import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createRecipeBookArgs,
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { RecipeBookWindow } from './RecipeBookWindow';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Windows/Recipe Book',
  component: RecipeBookWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    ...createRecipeBookArgs(fixtures.recipes),
    inventoryCounts: fixtures.inventoryCounts,
    onCraft: noop,
  },
  parameters: {
    controls: {
      exclude: ['onMove', 'onClose', 'onCraft'],
    },
  },
} satisfies Meta<typeof RecipeBookWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ForgeRecipes: Story = {};

export const MissingRecipeBook: Story = {
  args: {
    hasRecipeBook: false,
  },
};
