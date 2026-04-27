import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import type { TooltipPosition } from '@realmfall/ui';
import { isRecipePage } from '../../../game/inventory';
import {
  CORRUPTED_ITEM_COLOR,
  getItemDisplayName,
} from '../../../game/itemModifications';
import type { GameState } from '../../../game/stateTypes';
import { rarityColor } from '../../../ui/rarity';
import { getTooltipPlacementForRect } from '../../../ui/tooltipPlacement';
import type { TooltipLine } from '../../../ui/tooltips';
import type { TooltipItem, TooltipState } from '../types';
import {
  loadItemTooltipModule as loadItemTooltipModuleChunk,
  type ItemTooltipModule,
} from '../itemTooltipModuleLoader';
import { setTooltipState } from '../tooltipStore';

type ItemTooltipLinesBuilder = ItemTooltipModule['itemTooltipLines'];

type ItemTooltipLinesCache = WeakMap<
  TooltipItem,
  {
    withoutEquipped: Map<number, TooltipLine[]>;
    withoutEquippedRecipeLearned: Map<number, TooltipLine[]>;
    withEquipped: WeakMap<
      TooltipItem,
      {
        recipeUnknown: Map<number, TooltipLine[]>;
        recipeLearned: Map<number, TooltipLine[]>;
      }
    >;
  }
>;

interface UseItemTooltipControllerOptions {
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}

function getCachedItemTooltipLines(
  cache: ItemTooltipLinesCache,
  buildItemTooltipLines: ItemTooltipLinesBuilder,
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  recipeLearned: boolean,
  quickSellHint: boolean,
  playerLevel: number,
) {
  if (quickSellHint) {
    return buildItemTooltipLines(item, equipped, {
      playerLevel,
      recipeLearned,
      quickSellHint: true,
    });
  }

  let itemCache = cache.get(item);
  if (!itemCache) {
    itemCache = {
      withoutEquipped: new Map(),
      withoutEquippedRecipeLearned: new Map(),
      withEquipped: new WeakMap(),
    };
    cache.set(item, itemCache);
  }

  if (!equipped) {
    const cacheKey = recipeLearned
      ? itemCache.withoutEquippedRecipeLearned
      : itemCache.withoutEquipped;
    const cachedLines = cacheKey.get(playerLevel);
    if (cachedLines) {
      return cachedLines;
    }

    const lines = buildItemTooltipLines(item, undefined, {
      playerLevel,
      recipeLearned,
    });
    cacheKey.set(playerLevel, lines);
    return lines;
  }

  let equippedCache = itemCache.withEquipped.get(equipped);
  if (!equippedCache) {
    equippedCache = {
      recipeUnknown: new Map(),
      recipeLearned: new Map(),
    };
    itemCache.withEquipped.set(equipped, equippedCache);
  }

  const cacheKey = recipeLearned ? 'recipeLearned' : 'recipeUnknown';
  const cacheBucket = equippedCache[cacheKey];
  const cachedLines = cacheBucket.get(playerLevel);
  if (cachedLines) {
    return cachedLines;
  }

  const lines = buildItemTooltipLines(item, equipped, {
    playerLevel,
    recipeLearned,
  });
  cacheBucket.set(playerLevel, lines);
  return lines;
}

function getItemTooltipContentKey(
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  recipeLearned: boolean,
  quickSellHint: boolean,
  playerLevel: number,
) {
  return JSON.stringify({
    kind: 'item',
    item: {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      power: item.power,
      defense: item.defense,
      maxHp: item.maxHp,
      secondaryStats: item.secondaryStats,
      secondaryStatCapacity: item.secondaryStatCapacity,
      reforgedSecondaryStatIndex: item.reforgedSecondaryStatIndex,
      enchantedSecondaryStatIndex: item.enchantedSecondaryStatIndex,
      corrupted: item.corrupted ?? false,
      grantedAbilityId: item.grantedAbilityId,
    },
    equippedId: equipped?.id ?? null,
    recipeLearned,
    playerLevel,
    quickSellHint,
  });
}

function buildItemTooltipState({
  cache,
  buildItemTooltipLines,
  item,
  equipped,
  recipeLearned,
  quickSellHint,
  position,
  playerLevel,
}: {
  cache: ItemTooltipLinesCache;
  buildItemTooltipLines: ItemTooltipLinesBuilder;
  item: TooltipItem;
  equipped: TooltipItem | undefined;
  recipeLearned: boolean;
  quickSellHint: boolean;
  playerLevel: number;
  position: ReturnType<typeof getTooltipPlacementForRect>;
}): TooltipState {
  return {
    title: getItemDisplayName(item),
    lines: getCachedItemTooltipLines(
      cache,
      buildItemTooltipLines,
      item,
      equipped,
      recipeLearned,
      quickSellHint,
      playerLevel,
    ),
    contentKey: getItemTooltipContentKey(
      item,
      equipped,
      recipeLearned,
      quickSellHint,
      playerLevel,
    ),
    x: position.x,
    y: position.y,
    placement: position.placement,
    borderColor: item.corrupted
      ? CORRUPTED_ITEM_COLOR
      : rarityColor(item.rarity),
  };
}

function isRecipePageLearned(state: GameState, item: TooltipItem) {
  return (
    isRecipePage(item) &&
    item.recipeId != null &&
    state.player.learnedRecipeIds.includes(item.recipeId)
  );
}

export function useItemTooltipController({
  gameRef,
  tooltipPositionRef,
}: UseItemTooltipControllerOptions) {
  const itemTooltipLinesCacheRef = useRef<ItemTooltipLinesCache>(new WeakMap());
  const tooltipRequestIdRef = useRef(0);
  const itemTooltipModulePromiseRef =
    useRef<Promise<ItemTooltipModule | null>>(null);

  const closeTooltip = useCallback(() => {
    tooltipRequestIdRef.current += 1;
    tooltipPositionRef.current = null;
    setTooltipState(null);
  }, [tooltipPositionRef]);

  const setTooltip = useCallback((nextTooltip: TooltipState | null) => {
    setTooltipState(nextTooltip);
  }, []);

  const loadItemTooltipModule = useCallback(() => {
    itemTooltipModulePromiseRef.current ??= loadItemTooltipModuleChunk().catch(
      () => {
        itemTooltipModulePromiseRef.current = null;
        return null;
      },
    );
    return itemTooltipModulePromiseRef.current;
  }, []);

  const presentItemTooltip = useCallback(
    (
      item: TooltipItem,
      position: ReturnType<typeof getTooltipPlacementForRect>,
      equipped?: TooltipItem,
      quickSellHint = false,
    ) => {
      const recipeLearned = isRecipePageLearned(gameRef.current, item);
      const requestId = ++tooltipRequestIdRef.current;

      void loadItemTooltipModule().then((tooltipModule) => {
        if (tooltipRequestIdRef.current !== requestId) {
          return;
        }

        if (!tooltipModule) {
          tooltipPositionRef.current = null;
          setTooltipState(null);
          return;
        }

        tooltipPositionRef.current = position;
        setTooltipState(
        buildItemTooltipState({
          cache: itemTooltipLinesCacheRef.current,
          buildItemTooltipLines: tooltipModule.itemTooltipLines,
          item,
          equipped,
          recipeLearned,
          quickSellHint,
          playerLevel: gameRef.current.player.level,
          position,
        }),
      );
      });
    },
    [gameRef, loadItemTooltipModule, tooltipPositionRef],
  );

  const showItemTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      equipped?: TooltipItem,
      quickSellHint = false,
    ) => {
      presentItemTooltip(
        item,
        getTooltipPlacementForRect(event.currentTarget.getBoundingClientRect()),
        equipped,
        quickSellHint,
      );
    },
    [presentItemTooltip],
  );

  const showActionBarItemTooltip = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      presentItemTooltip(
        item,
        getTooltipPlacementForRect(
          event.currentTarget.getBoundingClientRect(),
          {
            preferredPlacements: ['top', 'right', 'left', 'bottom'],
          },
        ),
      );
    },
    [presentItemTooltip],
  );

  const showTooltip = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      title: string,
      lines: TooltipLine[],
      borderColor?: string,
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const position = getTooltipPlacementForRect(rect);
      tooltipPositionRef.current = position;
      setTooltipState({
        title,
        lines,
        contentKey: undefined,
        x: position.x,
        y: position.y,
        placement: position.placement,
        borderColor,
      });
    },
    [tooltipPositionRef],
  );

  return {
    closeTooltip,
    setTooltip,
    showActionBarItemTooltip,
    showItemTooltip,
    showTooltip,
  };
}
