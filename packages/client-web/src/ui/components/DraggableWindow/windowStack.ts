import type { WindowStackLayer } from './types';

export const WINDOW_ACTIVATED_EVENT = 'opencode-window-activated';

const WINDOW_STACK_LAYER_BASES: Record<WindowStackLayer, number> = {
  standard: 20,
  modal: 46,
};

const windowStackOrderByLayer: Record<WindowStackLayer, string[]> = {
  standard: [],
  modal: [],
};

const windowNodesById = new Map<
  string,
  { layer: WindowStackLayer; node: HTMLElement }
>();

export function registerWindow({
  id,
  layer,
  node,
}: {
  id: string;
  layer: WindowStackLayer;
  node: HTMLElement;
}) {
  const existing = windowNodesById.get(id);
  if (existing && existing.layer !== layer) {
    removeWindowFromLayer(existing.layer, id);
  }

  windowNodesById.set(id, { layer, node });
  const layerOrder = windowStackOrderByLayer[layer];
  if (!layerOrder.includes(id)) {
    layerOrder.push(id);
  }
  syncWindowStackLayer(layer);
}

export function unregisterWindow(id: string) {
  const existing = windowNodesById.get(id);
  if (!existing) {
    return;
  }

  windowNodesById.delete(id);
  removeWindowFromLayer(existing.layer, id);
  syncWindowStackLayer(existing.layer);
}

export function bringWindowToFront(id: string) {
  const existing = windowNodesById.get(id);
  if (!existing) {
    return;
  }

  const { layer } = existing;
  const layerOrder = windowStackOrderByLayer[layer];
  const currentIndex = layerOrder.indexOf(id);
  if (currentIndex !== -1) {
    layerOrder.splice(currentIndex, 1);
  }
  layerOrder.push(id);
  syncWindowStackLayer(layer);
}

function removeWindowFromLayer(layer: WindowStackLayer, id: string) {
  const layerOrder = windowStackOrderByLayer[layer];
  const currentIndex = layerOrder.indexOf(id);
  if (currentIndex !== -1) {
    layerOrder.splice(currentIndex, 1);
  }
}

function syncWindowStackLayer(layer: WindowStackLayer) {
  const baseZIndex = WINDOW_STACK_LAYER_BASES[layer];
  windowStackOrderByLayer[layer].forEach((id, index) => {
    const entry = windowNodesById.get(id);
    if (!entry || entry.layer !== layer) {
      return;
    }

    entry.node.style.zIndex = String(baseZIndex + index);
  });
}
