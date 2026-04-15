import type { Meta, StoryObj } from '@storybook/react-vite';
import { VersionStatusWidget } from './VersionStatusWidget';

const meta = {
  title: 'Shared/VersionStatusWidget',
  component: VersionStatusWidget,
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '12rem',
          position: 'relative',
          background: '#020617',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    currentVersion: '0.1.0',
    onRefresh: () => {},
    remoteVersion: '0.1.0',
    status: 'current',
  },
} satisfies Meta<typeof VersionStatusWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Current: Story = {};

export const Fetching: Story = {
  args: {
    remoteVersion: null,
    status: 'fetching',
  },
};

export const Outdated: Story = {
  args: {
    remoteVersion: '0.2.0',
    status: 'outdated',
  },
};
