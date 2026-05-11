import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { UiAudioProvider } from '../audio/UiAudioContext';
import { AppAudioBridgeLayer, AppShell } from './components/AppShell';
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
    <UiAudioProvider value={appRuntime.uiAudio}>
      <AppAudioBridgeLayer
        audioSettings={appRuntime.audioSettings}
        backgroundMusicMood={appRuntime.backgroundMusicMood}
        onUiAudioChange={appRuntime.onUiAudioChange}
        voicePlaybackState={appRuntime.voicePlaybackState}
      />
      <AppShell
        claimedHex={appRuntime.claimedHex}
        homeIndicatorState={appRuntime.homeIndicatorState}
        hostRef={appRuntime.hostRef}
        interfaceSettings={appRuntime.interfaceSettings}
        isReady={appRuntime.isReady}
        pixiWorldError={appRuntime.pixiWorldError}
        paused={appRuntime.paused}
        windowsProps={appRuntime.windowsProps}
        onRetryPixiWorld={appRuntime.onRetryPixiWorld}
      />
    </UiAudioProvider>
  );

  return isPerformanceHarnessActive() ? (
    <Profiler id="App" onRender={handleProfilerRender}>
      {shell}
    </Profiler>
  ) : (
    shell
  );
}
