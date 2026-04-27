import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { ResizableWindow } from './ResizableWindow';

const WINDOW_STORY_POSITION = { x: 80, y: 96, width: 320, height: 220 };

const meta = {
  title: 'UI Primitives/Resizable Window',
  component: ResizableWindow,
  render: (args) => <ResizableWindowStory {...args} />,
  args: {
    title: 'Resizable Window',
    resizeBounds: { minWidth: 280, minHeight: 180 },
    position: WINDOW_STORY_POSITION,
    onMove: () => undefined,
  },
} satisfies Meta<typeof ResizableWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function ResizableWindowStory(
  args: Omit<ComponentProps<typeof ResizableWindow>, 'position' | 'onMove' | 'children'>,
) {
  const [position, setPosition] = useState(WINDOW_STORY_POSITION);

  return (
    <ResizableWindow
      {...args}
      position={position}
      onMove={setPosition}
    >
      Resize from this bottom-right handle.
    </ResizableWindow>
  );
}
