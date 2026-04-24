import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import { isRecipePage } from '../../../game/inventory';
import {
  CORRUPTED_ITEM_COLOR,
  getItemDisplayName,
} from '../../../game/itemModifications';
import type { GameState } from '../../../game/stateTypes';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';
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
    withoutEquipped: TooltipLine[] | null;
    withoutEquippedRecipeLearned: TooltipLine[] | null;
    withEquipped: WeakMap<
      TooltipItem,
      {
        recipeUnknown: TooltipLine[] | null;
        recipeLearned: TooltipLine[] | null;
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
) {
  let itemCache = cache.get(item);
  if (!itemCache) {
    itemCache = {
      withoutEquipped: null,
      withoutEquippedRecipeLearned: null,
      withEquipped: new WeakMap(),
    };
    cache.set(item, itemCache);
  }

  if (!equipped) {
    const cacheKey = recipeLearned
      ? 'withoutEquippedRecipeLearned'
      : 'withoutEquipped';
    const cachedLines = itemCache[cacheKey];
    if (cachedLines) {
      return cachedLines;
    }

    const lines = buildItemTooltipLines(item, undefined, { recipeLearned });
    itemCache[cacheKey] = lines;
    return lines;
  }

  let equippedCache = itemCache.withEquipped.get(equipped);
  if (!equippedCache) {
    equippedCache = {
      recipeUnknown: null,
      recipeLearned: null,
    };
    itemCache.withEquipped.set(equipped, equippedCache);
  }

  const cacheKey = recipeLearned ? 'recipeLearned' : 'recipeUnknown';
  const cachedLines = equippedCache[cacheKey];
  if (cachedLines) {
    return cachedLines;
  }

  const lines = buildItemTooltipLines(item, equipped, { recipeLearned });
  equippedCache[cacheKey] = lines;
  return lines;
}

function getItemTooltipContentKey(
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  recipeLearned: boolean,
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
  });
}

function buildItemTooltipState({
  cache,
  buildItemTooltipLines,
  item,
  equipped,
  recipeLearned,
  position,
}: {
  cache: ItemTooltipLinesCache;
  buildItemTooltipLines: ItemTooltipLinesBuilder;
  item: TooltipItem;
  equipped: TooltipItem | undefined;
  recipeLearned: boolean;
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
    ),
    contentKey: getItemTooltipContentKey(item, equipped, recipeLearned),
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
    ) => {
      presentItemTooltip(
        item,
        getTooltipPlacementForRect(event.currentTarget.getBoundingClientRect()),
        equipped,
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
