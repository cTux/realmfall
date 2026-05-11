import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { WindowPosition } from '../../app/constants';
import { DeferredWindowShell } from './DeferredWindowShell';
import { createLazyWindowComponent } from './lazyWindowComponent';

type DemoContentProps = {
  message: string;
};

const DemoContent = createLazyWindowComponent<DemoContentProps>(async () => ({
  default: function DemoContent({ message }) {
    return <div style={{ padding: 16 }}>{message}</div>;
  },
}));

function DeferredWindowShellStory(
  args: Omit<
    ComponentProps<typeof DeferredWindowShell<DemoContentProps>>,
    'content' | 'contentProps' | 'position' | 'onMove'
  >,
) {
  const [position, setPosition] = useState<WindowPosition>({
    x: 96,
    y: 72,
    width: 320,
    height: 220,
  });

  return (
    <DeferredWindowShell
      {...args}
      position={position}
      onMove={(nextPosition: WindowPosition) => setPosition(nextPosition)}
      content={DemoContent}
      contentProps={{
        message:
          'Deferred window content stays behind one shared loading shell.',
      }}
    />
  );
}

const meta = {
  component: DeferredWindowShellStory,
  render: (args) => <DeferredWindowShellStory {...args} />,
  args: {
    title: 'Deferred Window',
    visible: true,
    externalUnmount: true,
  },
} satisfies Meta<typeof DeferredWindowShellStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
