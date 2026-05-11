import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ActionBarSlot } from './ActionBarSlot';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/ActionBarSlot',
  component: ActionBarSlot,
  decorators: [storySurfaceDecorator],
  args: {
    slotIndex: 0,
    item: fixtures.inventory[0],
    onClick: noop,
    onClear: noop,
    onHoverItem: noop,
    onLeaveItem: noop,
  },
  parameters: {
    controls: {
      exclude: ['onClick', 'onClear', 'onHoverItem', 'onLeaveItem'],
    },
  },
} satisfies Meta<typeof ActionBarSlot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Empty: Story = {
  args: {
    item: undefined,
  },
};

export const Depleted: Story = {
  args: {
    depleted: true,
  },
};
