import { useEffect, type MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import {
  normalizeCloudTransparency,
  normalizeWorldRenderFps,
} from '../../graphicsSettings';

interface UsePixiWorldRenderSettingsSyncArgs {
  appRef: MutableRefObject<Application | null>;
  cloudTransparency: number;
  cloudTransparencyRef: MutableRefObject<number>;
  paused: boolean;
  pausedAnimationMsRef: MutableRefObject<number | null>;
  pausedRef: MutableRefObject<boolean>;
  renderInvalidationRef: MutableRefObject<number>;
  showClouds: boolean;
  showCloudsRef: MutableRefObject<boolean>;
  showTerrainBackgrounds: boolean;
  showTerrainBackgroundsRef: MutableRefObject<boolean>;
  showTooltipTags: boolean;
  showTooltipTagsRef: MutableRefObject<boolean>;
  worldRenderFps: number;
  worldRenderFpsRef: MutableRefObject<number>;
}

export function usePixiWorldRenderSettingsSync({
  appRef,
  cloudTransparency,
  cloudTransparencyRef,
  paused,
  pausedAnimationMsRef,
  pausedRef,
  renderInvalidationRef,
  showClouds,
  showCloudsRef,
  showTerrainBackgrounds,
  showTerrainBackgroundsRef,
  showTooltipTags,
  showTooltipTagsRef,
  worldRenderFps,
  worldRenderFpsRef,
}: UsePixiWorldRenderSettingsSyncArgs): void {
  useEffect(() => {
    pausedRef.current = paused;
    pausedAnimationMsRef.current = paused ? performance.now() : null;
    renderInvalidationRef.current += 1;
  }, [paused, pausedAnimationMsRef, pausedRef, renderInvalidationRef]);

  useEffect(() => {
    showCloudsRef.current = showClouds;
    renderInvalidationRef.current += 1;
  }, [renderInvalidationRef, showClouds, showCloudsRef]);

  useEffect(() => {
    cloudTransparencyRef.current =
      normalizeCloudTransparency(cloudTransparency);
    renderInvalidationRef.current += 1;
  }, [cloudTransparency, cloudTransparencyRef, renderInvalidationRef]);

  useEffect(() => {
    showTerrainBackgroundsRef.current = showTerrainBackgrounds;
    renderInvalidationRef.current += 1;
  }, [
    renderInvalidationRef,
    showTerrainBackgrounds,
    showTerrainBackgroundsRef,
  ]);

  useEffect(() => {
    showTooltipTagsRef.current = showTooltipTags;
  }, [showTooltipTags, showTooltipTagsRef]);

  useEffect(() => {
    const normalizedWorldRenderFps = normalizeWorldRenderFps(worldRenderFps);
    worldRenderFpsRef.current = normalizedWorldRenderFps;
    renderInvalidationRef.current += 1;

    const app = appRef.current;
    if (!app) {
      return;
    }

    app.ticker.maxFPS = normalizedWorldRenderFps;
  }, [appRef, worldRenderFps, renderInvalidationRef, worldRenderFpsRef]);
}
