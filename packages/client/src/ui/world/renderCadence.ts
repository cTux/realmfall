export const MIN_WORLD_RENDER_FPS = 60;
export const MAX_WORLD_RENDER_FPS = 240;
export const DEFAULT_WORLD_RENDER_FPS = MIN_WORLD_RENDER_FPS;
export const WORLD_RENDER_FPS_STEP = 1;

export const ANIMATED_LAYER_FPS = DEFAULT_WORLD_RENDER_FPS;
export const ANIMATED_LAYER_FRAME_MS = 1000 / ANIMATED_LAYER_FPS;

export const getWorldRenderFrameMs = (worldRenderFps: number) =>
  1000 / worldRenderFps;
