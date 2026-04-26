import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { WINDOW_LABELS } from '../windowLabels';
import {
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from './storybook/storybookHelpers';
import { WindowShell } from './WindowShell';

const meta = {
  title: 'Components/Window Shell',
  component: WindowShell,
  decorators: [storySurfaceDecorator],
  render: (args) => <WindowShellStory {...args} />,
  args: {
    title: 'Watchtower Ledger',
    hotkeyLabel: WINDOW_LABELS.inventory,
    position: STORYBOOK_WINDOW_POSITION,
    onMove: () => undefined,
    children: (
      <div style={{ display: 'grid', gap: '10px' }}>
        <p style={{ margin: 0 }}>
          Shared window framing should preserve the draggable chrome while
          letting each window body stay focused on its own content.
        </p>
        <p style={{ margin: 0 }}>
          This story exercises the hotkey label path used by the actual window
          wrappers.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof WindowShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutHotkeyLabel: Story = {
  args: {
    hotkeyLabel: undefined,
    title: 'Window Without Label Decoration',
  },
};

function WindowShellStory(args: ComponentProps<typeof WindowShell>) {
  const [position, setPosition] = useState(STORYBOOK_WINDOW_POSITION);
  return <WindowShell {...args} position={position} onMove={setPosition} />;
}
