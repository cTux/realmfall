import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { HeroWindow } from './HeroWindow';

const fixtures = createStorybookFixtures();
const noopHoverDetail: NonNullable<
  ComponentProps<typeof HeroWindow>['onHoverDetail']
> = noop;

const meta = {
  title: 'Windows/Hero',
  component: HeroWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    stats: fixtures.heroStats,
    hunger: 24,
    thirst: fixtures.thirst,
    worldTimeMs: fixtures.worldTimeMs,
    onHoverDetail: noopHoverDetail,
    onLeaveDetail: noop,
  },
  parameters: {
    controls: {
      exclude: ['onMove', 'onClose', 'onHoverDetail', 'onLeaveDetail'],
    },
  },
} satisfies Meta<typeof HeroWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AdventurerOverview: Story = {};
