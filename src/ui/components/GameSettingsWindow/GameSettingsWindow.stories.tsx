import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { DEFAULT_GRAPHICS_SETTINGS } from '../../../app/constants';
import {
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { GameSettingsWindow } from './GameSettingsWindow';

const meta = {
  title: 'Components/Game Settings Window',
  component: GameSettingsWindow,
  decorators: [storySurfaceDecorator],
  render: (args) => <GameSettingsWindowStory {...args} />,
  args: {
    graphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
    onMove: () => undefined,
    onResetSaveData: () => undefined,
    onSave: async () => undefined,
    onSaveAndReload: async () => undefined,
    position: STORYBOOK_WINDOW_POSITION,
    visible: true,
  },
} satisfies Meta<typeof GameSettingsWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

function GameSettingsWindowStory(
  args: ComponentProps<typeof GameSettingsWindow>,
) {
  const [position, setPosition] = useState(args.position);
  const [graphicsSettings, setGraphicsSettings] = useState(
    args.graphicsSettings,
  );
  const [visible, setVisible] = useState(args.visible);

  return (
    <GameSettingsWindow
      {...args}
      graphicsSettings={graphicsSettings}
      position={position}
      visible={visible}
      onClose={() => setVisible(false)}
      onMove={setPosition}
      onResetSaveData={() => undefined}
      onSave={async (nextSettings) => {
        setGraphicsSettings(nextSettings);
      }}
      onSaveAndReload={async (nextSettings) => {
        setGraphicsSettings(nextSettings);
      }}
    />
  );
}
