import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GAMEPLAY_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
} from '../../../app/constants';
import { applyGraphicsPreset } from '../../../app/graphicsSettings';
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
    gameplaySettings: DEFAULT_GAMEPLAY_SETTINGS,
    graphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
    interfaceSettings: {
      ...DEFAULT_INTERFACE_SETTINGS,
      language: 'en',
    },
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

export const QualityPreset: Story = {
  args: {
    graphicsSettings: applyGraphicsPreset('quality'),
  },
};

function GameSettingsWindowStory(
  args: ComponentProps<typeof GameSettingsWindow>,
) {
  const [position, setPosition] = useState(args.position);
  const [audioSettings, setAudioSettings] = useState(args.audioSettings);
  const [gameplaySettings, setGameplaySettings] = useState(
    args.gameplaySettings,
  );
  const [graphicsSettings, setGraphicsSettings] = useState(
    args.graphicsSettings,
  );
  const [interfaceSettings, setInterfaceSettings] = useState(
    args.interfaceSettings,
  );
  const [visible, setVisible] = useState(args.visible);

  return (
    <GameSettingsWindow
      {...args}
      audioSettings={audioSettings}
      gameplaySettings={gameplaySettings}
      graphicsSettings={graphicsSettings}
      interfaceSettings={interfaceSettings}
      position={position}
      visible={visible}
      onClose={() => setVisible(false)}
      onMove={setPosition}
      onResetSaveArea={async () => undefined}
      onSave={async (nextSettings) => {
        setAudioSettings(nextSettings.audio);
        setGameplaySettings(nextSettings.gameplay);
        setGraphicsSettings(nextSettings.graphics);
        setInterfaceSettings(nextSettings.interface);
      }}
      onSaveAndReload={async (nextSettings) => {
        setAudioSettings(nextSettings.audio);
        setGameplaySettings(nextSettings.gameplay);
        setGraphicsSettings(nextSettings.graphics);
        setInterfaceSettings(nextSettings.interface);
      }}
    />
  );
}
