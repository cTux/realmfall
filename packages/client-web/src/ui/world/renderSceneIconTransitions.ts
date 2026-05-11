export const PLAYER_ICON_TRANSITION_KEY = 'player-icon';
export const WORLD_MARKER_ICON_TRANSITION_KEY_PREFIX = 'marker:';

const ICON_TRANSITION_DURATION_MS = 180;
const ICON_TRANSITION_RENDER_BUCKETS = 6;

export interface SceneIconPresentation {
  icon: string;
  tint: number;
}

interface ActiveSceneIconTransition {
  from: SceneIconPresentation;
  to: SceneIconPresentation;
  startedAtMs: number;
}

export interface SceneIconTransitionState {
  active: ActiveSceneIconTransition | null;
  current: SceneIconPresentation;
}

export interface SceneIconTransitionLayer extends SceneIconPresentation {
  alpha: number;
}

function cloneSceneIconPresentation({
  icon,
  tint,
}: SceneIconPresentation): SceneIconPresentation {
  return { icon, tint };
}

function sceneIconPresentationsEqual(
  left: SceneIconPresentation,
  right: SceneIconPresentation,
) {
  return left.icon === right.icon && left.tint === right.tint;
}

function getSceneIconTransitionProgress(
  transition: ActiveSceneIconTransition,
  animationMs: number,
) {
  return Math.max(
    0,
    Math.min(
      1,
      (animationMs - transition.startedAtMs) / ICON_TRANSITION_DURATION_MS,
    ),
  );
}

function settleSceneIconTransitionState(
  transitionState: SceneIconTransitionState,
  animationMs: number,
) {
  if (
    transitionState.active === null ||
    getSceneIconTransitionProgress(transitionState.active, animationMs) < 1
  ) {
    return;
  }

  transitionState.current = cloneSceneIconPresentation(
    transitionState.active.to,
  );
  transitionState.active = null;
}

function getDominantSceneIconPresentation(
  transitionState: SceneIconTransitionState,
  animationMs: number,
) {
  if (transitionState.active === null) {
    return transitionState.current;
  }

  return getSceneIconTransitionProgress(transitionState.active, animationMs) >=
    0.5
    ? transitionState.active.to
    : transitionState.active.from;
}

function hashIconTransitionTokenPart(hash: number, tokenPart: string) {
  let nextHash = hash;
  for (const character of tokenPart) {
    nextHash = Math.imul(nextHash ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return nextHash;
}

export function getSceneIconTransitionLayers(
  transitionStatesByKey: Map<string, SceneIconTransitionState>,
  key: string,
  desired: SceneIconPresentation,
  animationMs: number,
): SceneIconTransitionLayer[] {
  const existingTransitionState = transitionStatesByKey.get(key);
  if (!existingTransitionState) {
    transitionStatesByKey.set(key, {
      active: null,
      current: cloneSceneIconPresentation(desired),
    });
    return [{ ...desired, alpha: 1 }];
  }

  settleSceneIconTransitionState(existingTransitionState, animationMs);

  if (
    existingTransitionState.active !== null &&
    !sceneIconPresentationsEqual(existingTransitionState.active.to, desired)
  ) {
    existingTransitionState.current = cloneSceneIconPresentation(
      getDominantSceneIconPresentation(existingTransitionState, animationMs),
    );
    existingTransitionState.active = null;
  }

  if (
    existingTransitionState.active === null &&
    !sceneIconPresentationsEqual(existingTransitionState.current, desired)
  ) {
    existingTransitionState.active = {
      from: cloneSceneIconPresentation(existingTransitionState.current),
      to: cloneSceneIconPresentation(desired),
      startedAtMs: animationMs,
    };
  }

  settleSceneIconTransitionState(existingTransitionState, animationMs);

  if (existingTransitionState.active === null) {
    existingTransitionState.current = cloneSceneIconPresentation(desired);
    return [{ ...desired, alpha: 1 }];
  }

  const progress = getSceneIconTransitionProgress(
    existingTransitionState.active,
    animationMs,
  );

  return [
    {
      ...existingTransitionState.active.from,
      alpha: 1 - progress,
    },
    {
      ...existingTransitionState.active.to,
      alpha: progress,
    },
  ].filter((layer) => layer.alpha > 0);
}

export function getSceneIconTransitionRenderToken(
  transitionStatesByKey: Map<string, SceneIconTransitionState>,
  animationMs: number,
  keyPrefix?: string,
) {
  const activeTransitionTokenParts: string[] = [];

  transitionStatesByKey.forEach((transitionState, key) => {
    if (keyPrefix && !key.startsWith(keyPrefix)) {
      return;
    }

    settleSceneIconTransitionState(transitionState, animationMs);
    if (transitionState.active === null) {
      return;
    }

    const progress = getSceneIconTransitionProgress(
      transitionState.active,
      animationMs,
    );
    activeTransitionTokenParts.push(
      `${key}:${Math.min(
        ICON_TRANSITION_RENDER_BUCKETS,
        Math.floor(progress * ICON_TRANSITION_RENDER_BUCKETS),
      )}`,
    );
  });

  if (activeTransitionTokenParts.length === 0) {
    return null;
  }

  return activeTransitionTokenParts
    .sort()
    .reduce(hashIconTransitionTokenPart, 2166136261);
}

export function pruneUnusedSceneIconTransitionStates(
  transitionStatesByKey: Map<string, SceneIconTransitionState>,
  usedKeys: Set<string>,
  keyPrefix: string,
) {
  const staleKeys: string[] = [];

  transitionStatesByKey.forEach((_transitionState, key) => {
    if (key.startsWith(keyPrefix) && !usedKeys.has(key)) {
      staleKeys.push(key);
    }
  });

  staleKeys.forEach((key) => {
    transitionStatesByKey.delete(key);
  });
}
