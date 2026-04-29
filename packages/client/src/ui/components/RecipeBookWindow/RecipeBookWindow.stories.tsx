import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skill } from '../../../game/types';
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
    inventoryCountsByItemKey: fixtures.inventoryCountsByItemKey,
    materialFilterItemKey: null,
    onResetMaterialFilter: noop,
    onCraft: noop,
    onToggleFavoriteRecipe: noop,
  },
  parameters: {
    controls: {
      exclude: ['onMove', 'onClose', 'onCraft', 'onToggleFavoriteRecipe'],
    },
  },
} satisfies Meta<typeof RecipeBookWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ForgeRecipes: Story = {};

export const HandRecipes: Story = {
  args: {
    currentStructure: undefined,
    preferredSkill: Skill.Hand,
  },
};

export const CraftingFilters: Story = {
  args: {
    currentStructure: 'workshop',
    preferredSkill: Skill.Crafting,
  },
};
