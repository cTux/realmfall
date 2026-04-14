import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { LootWindow } from './LootWindow';

const fixtures = createStorybookFixtures();
const noopHoverItem: NonNullable<
  ComponentProps<typeof LootWindow>['onHoverItem']
> = noop;

const meta = {
  title: 'Windows/Loot',
  component: LootWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    loot: fixtures.loot,
    equipment: fixtures.equipment,
    onClose: noop,
    onTakeAll: noop,
    onTakeItem: noop,
    onHoverItem: noopHoverItem,
    onLeaveItem: noop,
  },
  parameters: {
    controls: {
      exclude: [
        'onMove',
        'onClose',
        'onTakeAll',
        'onTakeItem',
        'onHoverItem',
        'onLeaveItem',
      ],
    },
  },
} satisfies Meta<typeof LootWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SalvagePile: Story = {};
