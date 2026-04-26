import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
} from '../../../app/constants';
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
    audioSettings: DEFAULT_AUDIO_SETTINGS,
    graphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
    onMove: () => undefined,
    onResetSaveArea: async () => undefined,
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
  const [audioSettings, setAudioSettings] = useState(args.audioSettings);
  const [graphicsSettings, setGraphicsSettings] = useState(
    args.graphicsSettings,
  );
  const [visible, setVisible] = useState(args.visible);

  return (
    <GameSettingsWindow
      {...args}
      audioSettings={audioSettings}
      graphicsSettings={graphicsSettings}
      position={position}
      visible={visible}
      onClose={() => setVisible(false)}
      onMove={setPosition}
      onResetSaveArea={async () => undefined}
      onSave={async (nextSettings) => {
        setAudioSettings(nextSettings.audio);
        setGraphicsSettings(nextSettings.graphics);
      }}
      onSaveAndReload={async (nextSettings) => {
        setAudioSettings(nextSettings.audio);
        setGraphicsSettings(nextSettings.graphics);
      }}
    />
  );
}
