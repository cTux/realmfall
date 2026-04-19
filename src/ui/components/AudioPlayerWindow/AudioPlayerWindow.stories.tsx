import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { AudioPlayerWindow } from './AudioPlayerWindow';

const playlist = [
  {
    area: 'ambient',
    id: 'ambient:1',
    label: 'Finding mithral openworld game',
    src: 'ambient-1.mp3',
  },
  {
    area: 'ambient',
    id: 'ambient:2',
    label: 'Hopeless',
    src: 'ambient-2.mp3',
  },
  {
    area: 'ambient',
    id: 'ambient:3',
    label: 'Never again',
    src: 'ambient-3.mp3',
  },
] as const;

const meta = {
  title: 'Windows/Audio Player',
  component: AudioPlayerWindow,
  decorators: [storySurfaceDecorator],
  args: {
    area: 'ambient',
    canPlay: true,
    currentTime: 47,
    currentTrack: playlist[0],
    currentTrackIndex: 0,
    duration: 183,
    isPlaying: true,
    onClose: noop,
    onMove: noop,
    onNextTrack: noop,
    onPlayPause: noop,
    onPreviousTrack: noop,
    onSeek: noop,
    playlist: [...playlist],
    position: { ...STORYBOOK_WINDOW_POSITION, width: 420, height: 320 },
    progress: 47 / 183,
    visible: true,
  },
} satisfies Meta<typeof AudioPlayerWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AmbientPlayback: Story = {};
