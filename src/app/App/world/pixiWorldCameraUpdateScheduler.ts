import type { Container } from 'pixi.js';
import {
  applyWorldMapCameraToContainer,
  type WorldMapCameraState,
} from '../../../ui/world/worldMapCamera';

export type QueueWorldMapCameraUpdate = (
  nextCamera: WorldMapCameraState,
) => void;

interface WorldMapCameraUpdateSchedulerArgs {
  getWorldMapContainer: () => Container;
  screen: { width: number; height: number };
  requestFrame?: typeof window.requestAnimationFrame;
  cancelFrame?: typeof window.cancelAnimationFrame;
}

export function createWorldMapCameraUpdateScheduler({
  getWorldMapContainer,
  screen,
  requestFrame = window.requestAnimationFrame.bind(window),
  cancelFrame = window.cancelAnimationFrame.bind(window),
}: WorldMapCameraUpdateSchedulerArgs) {
  let pendingCamera: WorldMapCameraState | null = null;
  let pendingFrame: number | null = null;

  const applyPendingCamera = () => {
    pendingFrame = null;

    const nextCamera = pendingCamera;
    pendingCamera = null;

    if (!nextCamera) {
      return;
    }

    applyWorldMapCameraToContainer(getWorldMapContainer(), screen, nextCamera);
  };

  return {
    queue: (nextCamera: WorldMapCameraState) => {
      pendingCamera = nextCamera;

      if (pendingFrame !== null) {
        return;
      }

      pendingFrame = requestFrame(applyPendingCamera);
    },
    dispose: () => {
      if (pendingFrame !== null) {
        cancelFrame(pendingFrame);
      }

      pendingFrame = null;
      pendingCamera = null;
    },
  };
}
