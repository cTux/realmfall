import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createStorybookFixtures,
  noop,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { ItemContextMenu } from './ItemContextMenu';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/Item Context Menu',
  component: ItemContextMenu,
  decorators: [storySurfaceDecorator],
  args: {
    item: fixtures.inventory[0],
    x: 120,
    y: 80,
    canEquip: true,
    canUse: false,
    onEquip: noop,
    onUse: noop,
    onDrop: noop,
    onClose: noop,
  },
} satisfies Meta<typeof ItemContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Equippable: Story = {};

export const Consumable: Story = {
  args: {
    item:
      fixtures.inventory.find((item) => item.kind === 'consumable') ??
      fixtures.inventory[0],
    canEquip: false,
    canUse: true,
  },
};
