import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { DebuggerWindow } from './DebuggerWindow';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Windows/Debugger',
  component: DebuggerWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    timeLabel: fixtures.debuggerTimeLabel,
  },
  parameters: {
    controls: {
      exclude: ['onMove', 'onClose'],
    },
  },
} satisfies Meta<typeof DebuggerWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WorldClock: Story = {};
