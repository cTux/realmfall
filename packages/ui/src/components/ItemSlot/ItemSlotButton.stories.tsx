import type { Meta, StoryObj } from '@storybook/react-vite';
import { EquipmentSlotId } from '../../game/content/ids';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ItemSlotButton } from './ItemSlotButton';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/ItemSlot',
  component: ItemSlotButton,
  decorators: [storySurfaceDecorator],
  args: {
    item: fixtures.inventory[0],
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

export const EmptyEquipmentSlot: Story = {
  args: {
    item: undefined,
    slot: EquipmentSlotId.Head,
  },
};

export const RecipeHighlight: Story = {
  args: {
    size: 'compact',
    borderColorOverride: '#22c55e',
    overlayColorOverride: 'rgba(96, 165, 250, 0.28)',
  },
};
