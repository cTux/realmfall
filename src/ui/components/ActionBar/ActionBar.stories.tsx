import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ActionBar } from './ActionBar';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/ActionBar',
  component: ActionBar,
  decorators: [storySurfaceDecorator],
  args: {
    inventory: fixtures.inventory,
    slots: [
      { item: fixtures.inventory[0]! },
      { item: fixtures.inventory.find((item) => item.healing > 0)! },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
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
    slots: [
      { item: fixtures.inventory[0]! },
      ...Array.from({ length: 8 }, () => null),
    ],
    onClearSlot: noop,
  },
};
