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

export const SurvivalBars: Story = {
  args: {
    hunger: 61,
    thirst: 43,
  },
};

export const AbilityLoadout: Story = {
  args: {
    stats: fixtures.heroStats,
  },
};

export const OvercappedSecondaryStats: Story = {
  args: {
    stats: {
      ...fixtures.heroStats,
      secondaryStatTotals: {
        ...(fixtures.heroStats.secondaryStatTotals ?? {}),
        bonusExperience: { effective: 143, raw: 143 },
        criticalStrikeChance: { effective: 75, raw: 143 },
        criticalStrikeDamage: { effective: 225, raw: 293 },
        attackSpeed: { effective: 1.75, raw: 2.43 },
      },
      bonusExperience: 143,
      criticalStrikeChance: 75,
      criticalStrikeDamage: 225,
      attackSpeed: 1.75,
    },
  },
};

export const CompactScrollable: Story = {
  args: {
    position: {
      ...STORYBOOK_WINDOW_POSITION,
      width: 320,
      height: 260,
    },
  },
};
