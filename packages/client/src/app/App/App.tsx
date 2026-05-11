import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { AppShell } from './components/AppShell';
import { useAppRuntime } from './hooks/useAppRuntime';
import {
  isPerformanceHarnessActive,
  recordReactCommit,
} from '../../performance/performanceBridge';

const handleProfilerRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  _baseDuration,
  startTime,
  commitTime,
) => recordReactCommit(id, phase, actualDuration, startTime, commitTime);

export function App() {
  const appRuntime = useAppRuntime();

  const shell = (
    <AppShell
      audioSettings={appRuntime.audioSettings}
      backgroundMusicMood={appRuntime.backgroundMusicMood}
      claimedHex={appRuntime.claimedHex}
      shellState={appRuntime.shellState}
      hostRef={appRuntime.hostRef}
      interfaceSettings={appRuntime.interfaceSettings}
      isReady={appRuntime.isReady}
      pixiWorldError={appRuntime.pixiWorldError}
      paused={appRuntime.paused}
      uiAudio={appRuntime.uiAudio}
      windowsProps={appRuntime.windowsProps}
      onRetryPixiWorld={appRuntime.onRetryPixiWorld}
      onUiAudioChange={appRuntime.onUiAudioChange}
    />
  );

  return isPerformanceHarnessActive() ? (
    <Profiler id="App" onRender={handleProfilerRender}>
      {shell}
    </Profiler>
  ) : (
    shell
  );
}
