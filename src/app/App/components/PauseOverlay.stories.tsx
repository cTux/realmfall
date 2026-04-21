import type { Meta, StoryObj } from '@storybook/react-vite';
import { storySurfaceDecorator } from '../../../ui/components/storybook/storybookHelpers';
import { PauseOverlay } from './PauseOverlay';

const meta = {
  title: 'App/Pause Overlay',
  component: PauseOverlay,
  decorators: [storySurfaceDecorator],
  args: {
    title: 'Game paused',
    subtitle: 'Press Space to resume gameplay.',
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #1e293b 0%, #0f172a 40%, #020617 100%)',
      }}
    >
      <PauseOverlay {...args} />
    </div>
  ),
} satisfies Meta<typeof PauseOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
