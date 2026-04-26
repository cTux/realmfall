import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarTimestamp } from './CalendarTimestamp';
import { storySurfaceDecorator } from '../storybook/storybookHelpers';

const meta = {
  title: 'Components/Calendar Timestamp',
  component: CalendarTimestamp,
  decorators: [storySurfaceDecorator],
  args: {
    timestampMs: 46_000,
    display: 'full',
  },
} satisfies Meta<typeof CalendarTimestamp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullLabel: Story = {};

export const TimeOnly: Story = {
  args: {
    display: 'time',
  },
};
