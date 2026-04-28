import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Button } from '@realmfall/ui';
import {
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { DraggableWindow } from './DraggableWindow';

const meta = {
  title: 'Components/Draggable Window',
  component: DraggableWindow,
  decorators: [storySurfaceDecorator],
  args: {
    title: 'Watchtower Briefing',
    position: STORYBOOK_WINDOW_POSITION,
    onMove: () => undefined,
    children: (
      <div style={{ display: 'grid', gap: '10px' }}>
        <p style={{ margin: 0 }}>
          The frontier is quiet for now, but the road to the drowned quarry is
          still unsafe after sundown.
        </p>
        <p style={{ margin: 0 }}>
          Drag the frame to check how the motion and activation styling behaves.
        </p>
      </div>
    ),
  },
  render: (args) => <DraggableWindowStory {...args} />,
} satisfies Meta<typeof DraggableWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHeaderActions: Story = {
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: () => undefined,
    headerActions: (
      <Button type="button" style={{ padding: '6px 10px' }}>
        Pin
      </Button>
    ),
  },
};

function DraggableWindowStory(
  args: Omit<ComponentProps<typeof DraggableWindow>, 'position' | 'onMove'>,
) {
  const [position, setPosition] = useState(STORYBOOK_WINDOW_POSITION);
  return <DraggableWindow {...args} position={position} onMove={setPosition} />;
}
