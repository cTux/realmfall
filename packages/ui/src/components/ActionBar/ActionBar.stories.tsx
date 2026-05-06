import type { Meta, StoryObj } from '@storybook/react-vite';
import { createDefaultActionBarSlots } from '../../game/actionBar';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ActionBar } from './ActionBar';

const fixtures = createStorybookFixtures();
const defaultSlots = createDefaultActionBarSlots();
defaultSlots[0] = { item: fixtures.inventory[0]! };
defaultSlots[1] = {
  item: fixtures.inventory.find((item) => item.healing > 0)!,
};
const depletedSlots = createDefaultActionBarSlots();
depletedSlots[0] = { item: fixtures.inventory[0]! };

const meta = {
  title: 'Components/ActionBar',
  component: ActionBar,
  decorators: [storySurfaceDecorator],
  args: {
    inventory: fixtures.inventory,
    slots: defaultSlots,
    onAssignSlot: noop,
    onClearSlot: noop,
    onHoverItem: noop,
    onLeaveItem: noop,
  },
  parameters: {
    controls: {
      exclude: ['onAssignSlot', 'onClearSlot', 'onHoverItem', 'onLeaveItem'],
    },
  },
} satisfies Meta<typeof ActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DepletedSlot: Story = {
  args: {
    inventory: fixtures.inventory.filter(
      (item) => item.name !== fixtures.inventory[0]?.name,
    ),
    slots: depletedSlots,
    onClearSlot: noop,
  },
};
