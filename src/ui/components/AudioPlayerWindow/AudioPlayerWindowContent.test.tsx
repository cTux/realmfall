import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AudioPlayerWindowContent } from './AudioPlayerWindowContent';

describe('AudioPlayerWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('renders the current track, controls, and playlist state', async () => {
    await act(async () => {
      root.render(
        <AudioPlayerWindowContent
          area="combat"
          canPlay
          currentTime={32}
          currentTrack={{
            area: 'combat',
            id: 'combat:track-1',
            label: 'Battle of the dragons',
            src: 'battle.mp3',
          }}
          currentTrackIndex={0}
          duration={120}
          isPlaying
          onNextTrack={() => {}}
          onPlayPause={() => {}}
          onPreviousTrack={() => {}}
          onSeek={() => {}}
          playlist={[
            {
              area: 'combat',
              id: 'combat:track-1',
              label: 'Battle of the dragons',
              src: 'battle.mp3',
            },
            {
              area: 'combat',
              id: 'combat:track-2',
              label: 'The tournament',
              src: 'tournament.mp3',
            },
          ]}
          progress={32 / 120}
        />,
      );
    });

    expect(host.textContent).toContain('Battle of the dragons');
    expect(host.textContent).toContain('Previous');
    expect(host.textContent).toContain('Pause');
    expect(host.textContent).toContain('Next');
    expect(host.textContent).toContain('Playlist (2)');
    expect(host.textContent).toContain('Playing');
    expect(host.textContent).toContain('0:32');
    expect(host.textContent).toContain('2:00');
  });
});
