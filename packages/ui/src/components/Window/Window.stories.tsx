import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { Window } from './Window';

const WINDOW_STORY_POSITION = { x: 64, y: 80 };

const meta = {
  title: 'UI Primitives/Window',
  component: Window,
  render: (args) => <WindowStory {...args} />,
  args: {
    children: 'Reusable draggable window shell.',
    title: 'Window',
    position: WINDOW_STORY_POSITION,
    onMove: () => undefined,
  },
} satisfies Meta<typeof Window>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function WindowStory(
  args: Omit<ComponentProps<typeof Window>, 'position' | 'onMove'>,
) {
  const [position, setPosition] = useState<
    ComponentProps<typeof Window>['position']
  >(WINDOW_STORY_POSITION);

  return (
    <Window
      {...args}
      position={position}
      onMove={(nextPosition) => setPosition(nextPosition)}
    >
      {args.children}
    </Window>
  );
}
