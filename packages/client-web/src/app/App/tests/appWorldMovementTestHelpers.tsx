import { act } from 'react';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { renderScene, tickerCallbacks } from './appTestHarness';

export function getRenderedGame() {
  const lastCall = renderScene.mock.calls[renderScene.mock.calls.length - 1];
  return lastCall?.[1] as GameState | undefined;
}

export async function clickWorldTile(canvas: Element) {
  await act(async () => {
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
  });
}

export function findRecipeBookDockButton(host: HTMLElement) {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.getAttribute('aria-label')?.startsWith('Toggle Recipe book window'),
  ) as HTMLButtonElement | undefined;
}

export function getTab(host: HTMLElement, label: string) {
  return Array.from(host.querySelectorAll('[role="tab"]')).find(
    (tab) => tab.textContent === label,
  );
}

export async function renderTickerFrame() {
  await act(async () => {
    tickerCallbacks.forEach((callback) => callback());
    await Promise.resolve();
  });
}
