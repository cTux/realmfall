import type { HexCoord, TileClaim } from '../../../game/stateTypes';
import { canSetHomeAction } from './homeActionAvailability';
import { useAppShortcutBindings } from './useAppShortcutBindings';

type ShortcutBindingsArgs = Parameters<typeof useAppShortcutBindings>[0];

interface UseAppShortcutRuntimeArgs extends Omit<
  ShortcutBindingsArgs,
  'canSetHomeAction'
> {
  currentTileClaim: TileClaim | null | undefined;
  homeHex: HexCoord;
  playerCoord: HexCoord;
}

export function useAppShortcutRuntime({
  currentTileClaim,
  homeHex,
  playerCoord,
  ...shortcutBindings
}: UseAppShortcutRuntimeArgs) {
  useAppShortcutBindings({
    ...shortcutBindings,
    canSetHomeAction: canSetHomeAction({
      currentTileClaim,
      homeHex,
      playerCoord,
    }),
  });
}
