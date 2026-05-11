import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import {
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { DebugWindow } from './DebugWindow';

const meta = {
  title: 'Components/Debug Window',
  component: DebugWindow,
  decorators: [storySurfaceDecorator],
  render: (args) => <DebugWindowStory {...args} />,
  args: {
    onCreateEquipmentItem: () => undefined,
    onCreateDropItem: () => undefined,
    onSpawnEnemyNearby: () => undefined,
    onTriggerBloodMoon: () => undefined,
    onTriggerHarvestMoon: () => undefined,
    onTriggerEarthquake: () => undefined,
    onSetMorning: () => undefined,
    onSetNight: () => undefined,
    onMove: () => undefined,
    position: STORYBOOK_WINDOW_POSITION,
    visible: true,
  },
} satisfies Meta<typeof DebugWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

function DebugWindowStory(args: ComponentProps<typeof DebugWindow>) {
  const [position, setPosition] = useState(args.position);
  const [visible, setVisible] = useState(args.visible);

  return (
    <DebugWindow
      {...args}
      position={position}
      visible={visible}
      onClose={() => setVisible(false)}
      onMove={setPosition}
    />
  );
}
