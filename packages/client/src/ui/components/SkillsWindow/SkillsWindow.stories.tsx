import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { SkillsWindow } from './SkillsWindow';

const fixtures = createStorybookFixtures();
const noopHoverDetail: NonNullable<
  ComponentProps<typeof SkillsWindow>['onHoverDetail']
> = noop;

const meta = {
  title: 'Windows/Skills',
  component: SkillsWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    skills: fixtures.skills,
    onHoverDetail: noopHoverDetail,
    onLeaveDetail: noop,
  },
  parameters: {
    controls: {
      exclude: ['onMove', 'onClose', 'onHoverDetail', 'onLeaveDetail'],
    },
  },
} satisfies Meta<typeof SkillsWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LearnedDisciplines: Story = {};
