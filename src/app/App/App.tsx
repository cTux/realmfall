import { AppShell } from './components/AppShell';
import { useAppRuntime } from './hooks/useAppRuntime';

export function App() {
  const appRuntime = useAppRuntime();

  return (
    <AppShell
      audioSettings={appRuntime.audioSettings}
      backgroundMusicMood={appRuntime.backgroundMusicMood}
      claimedHex={appRuntime.claimedHex}
      game={appRuntime.game}
      hostRef={appRuntime.hostRef}
      isReady={appRuntime.isReady}
      paused={appRuntime.paused}
      uiAudio={appRuntime.uiAudio}
      windowsProps={appRuntime.windowsProps}
      onUiAudioChange={appRuntime.onUiAudioChange}
    />
  );
}
