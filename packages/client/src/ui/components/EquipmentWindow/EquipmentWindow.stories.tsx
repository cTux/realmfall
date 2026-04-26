import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { EquipmentWindow } from './EquipmentWindow';

const fixtures = createStorybookFixtures();
const noopHoverItem: NonNullable<
  ComponentProps<typeof EquipmentWindow>['onHoverItem']
> = noop;
const noopContextItem: NonNullable<
  ComponentProps<typeof EquipmentWindow>['onContextItem']
> = noop;

const meta = {
  title: 'Windows/Equipment',
  component: EquipmentWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    equipment: fixtures.equipment,
    onHoverItem: noopHoverItem,
    onLeaveItem: noop,
    onUnequip: noop,
    onContextItem: noopContextItem,
  },
  parameters: {
    controls: {
      exclude: [
        'onMove',
        'onClose',
        'onHoverItem',
        'onLeaveItem',
        'onUnequip',
        'onContextItem',
      ],
    },
  },
} satisfies Meta<typeof EquipmentWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GearedTraveler: Story = {};
