import { useRef, useState } from 'react';
import { createGame } from '../../../game/stateFactory';
import type { GameState } from '../../../game/stateTypes';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';
import { WORLD_RADIUS } from '../../constants';
import { loadAudioSettings } from '../../audioSettings';
import {
  DEFAULT_UI_AUDIO_CONTROLLER,
  type UiAudioController,
} from '../../audio/UiAudioContext';
import { loadGraphicsSettings } from '../../graphicsSettings';

export function useAppBootstrapState() {
  const initialAudioSettingsRef = useRef(loadAudioSettings());
  const initialGraphicsSettingsRef = useRef(loadGraphicsSettings());
  const initialGameRef = useRef<GameState>(createGame(WORLD_RADIUS));
  const gameRef = useRef<GameState>(initialGameRef.current);
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const worldTimeMsRef = useRef(initialGameRef.current.worldTimeMs);
  const worldTimeTickRef = useRef<number | null>(null);
  const lastDisplayedWorldSecondRef = useRef(
    Math.floor(initialGameRef.current.worldTimeMs / 1000),
  );
  const [game, setGame] = useState<GameState>(initialGameRef.current);
  const [paused, setPaused] = useState(false);
  const [uiAudio, setUiAudio] = useState<UiAudioController>(
    DEFAULT_UI_AUDIO_CONTROLLER,
  );

  return {
    game,
    gameRef,
    initialAudioSettings: initialAudioSettingsRef.current,
    initialGame: initialGameRef.current,
    initialGraphicsSettings: initialGraphicsSettingsRef.current,
    lastDisplayedWorldSecondRef,
    paused,
    setGame,
    setPaused,
    setUiAudio,
    tooltipPositionRef,
    uiAudio,
    worldTimeMsRef,
    worldTimeTickRef,
  };
}
