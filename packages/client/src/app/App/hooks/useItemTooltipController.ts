import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import type { TooltipLine, TooltipPosition } from '@realmfall/ui-react';
import { itemOccupiesOffhand } from '../../../game/content/items';
import { isRecipePage } from '../../../game/inventory';
import {
  CORRUPTED_ITEM_COLOR,
  getItemDisplayName,
} from '../../../game/itemModifications';
import type { GameState } from '../../../game/stateTypes';
import { rarityColor } from '../../../ui/rarity';
import { getTooltipPlacementForRect } from '@realmfall/ui-react';
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
    withoutEquipped: Map<string, TooltipLine[]>;
    withoutEquippedRecipeLearned: Map<string, TooltipLine[]>;
    withEquipped: WeakMap<
      TooltipItem,
      {
        recipeUnknown: Map<string, TooltipLine[]>;
        recipeLearned: Map<string, TooltipLine[]>;
      }
    >;
  }
>;

interface UseItemTooltipControllerOptions {
  gameRef: MutableRefObject<GameState>;
  showTooltipTags: boolean;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
}

function getCachedItemTooltipLines(
  cache: ItemTooltipLinesCache,
  buildItemTooltipLines: ItemTooltipLinesBuilder,
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  replacedOffhand: TooltipItem | undefined,
  recipeLearned: boolean,
  quickSellHint: boolean,
  playerLevel: number,
  lockpickingLevel: number,
  showTooltipTags: boolean,
) {
  if (quickSellHint || replacedOffhand) {
    return buildItemTooltipLines(item, equipped, {
      lockpickingLevel,
      playerLevel,
      recipeLearned,
      replacedOffhand,
      quickSellHint,
      showTags: showTooltipTags,
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
    const cachedLines = cacheKey.get(
      getTooltipLineCacheKey(playerLevel, lockpickingLevel, showTooltipTags),
    );
    if (cachedLines) {
      return cachedLines;
    }

    const lines = buildItemTooltipLines(item, undefined, {
      lockpickingLevel,
      playerLevel,
      recipeLearned,
      showTags: showTooltipTags,
    });
    cacheKey.set(
      getTooltipLineCacheKey(playerLevel, lockpickingLevel, showTooltipTags),
      lines,
    );
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
  const cachedLines = cacheBucket.get(
    getTooltipLineCacheKey(playerLevel, lockpickingLevel, showTooltipTags),
  );
  if (cachedLines) {
    return cachedLines;
  }

  const lines = buildItemTooltipLines(item, equipped, {
    lockpickingLevel,
    playerLevel,
    recipeLearned,
    showTags: showTooltipTags,
  });
  cacheBucket.set(
    getTooltipLineCacheKey(playerLevel, lockpickingLevel, showTooltipTags),
    lines,
  );
  return lines;
}

function getItemTooltipContentKey(
  item: TooltipItem,
  equipped: TooltipItem | undefined,
  replacedOffhand: TooltipItem | undefined,
  recipeLearned: boolean,
  quickSellHint: boolean,
  playerLevel: number,
  lockpickingLevel: number,
  showTooltipTags: boolean,
) {
  return JSON.stringify({
    k: 'i',
    i: {
      id: item.id,
      n: item.name,
      r: item.rarity,
      p: item.power,
      d: item.defense,
      h: item.maxHp,
      s: item.secondaryStats,
      c: item.secondaryStatCapacity,
      rf: item.reforgedSecondaryStatIndex,
      en: item.enchantedSecondaryStatIndex,
      x: item.corrupted ?? false,
      a: item.grantedAbilityId,
    },
    e: equipped?.id ?? null,
    o: replacedOffhand
      ? {
          id: replacedOffhand.id,
          d: replacedOffhand.defense,
          h: replacedOffhand.maxHp,
          p: replacedOffhand.power,
          s: replacedOffhand.secondaryStats,
        }
      : null,
    r: recipeLearned,
    l: lockpickingLevel,
    p: playerLevel,
    q: quickSellHint,
    t: showTooltipTags,
  });
}

function buildItemTooltipState({
  cache,
  buildItemTooltipLines,
  item,
  equipped,
  replacedOffhand,
  recipeLearned,
  quickSellHint,
  position,
  playerLevel,
  lockpickingLevel,
  showTooltipTags,
}: {
  cache: ItemTooltipLinesCache;
  buildItemTooltipLines: ItemTooltipLinesBuilder;
  item: TooltipItem;
  equipped: TooltipItem | undefined;
  replacedOffhand: TooltipItem | undefined;
  recipeLearned: boolean;
  quickSellHint: boolean;
  playerLevel: number;
  lockpickingLevel: number;
  position: ReturnType<typeof getTooltipPlacementForRect>;
  showTooltipTags: boolean;
}): TooltipState {
  return {
    title: getItemDisplayName(item),
    lines: getCachedItemTooltipLines(
      cache,
      buildItemTooltipLines,
      item,
      equipped,
      replacedOffhand,
      recipeLearned,
      quickSellHint,
      playerLevel,
      lockpickingLevel,
      showTooltipTags,
    ),
    contentKey: getItemTooltipContentKey(
      item,
      equipped,
      replacedOffhand,
      recipeLearned,
      quickSellHint,
      playerLevel,
      lockpickingLevel,
      showTooltipTags,
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
  showTooltipTags,
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
      const replacedOffhand = itemOccupiesOffhand(item)
        ? gameRef.current.player.equipment.offhand
        : undefined;
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
        const lockpickingLevel = getPlayerLockpickingLevel(gameRef.current);
        setTooltipState(
          buildItemTooltipState({
            cache: itemTooltipLinesCacheRef.current,
            buildItemTooltipLines: tooltipModule.itemTooltipLines,
            item,
            equipped,
            replacedOffhand,
            recipeLearned,
            quickSellHint,
            playerLevel: gameRef.current.player.level,
            lockpickingLevel,
            position,
            showTooltipTags,
          }),
        );
      });
    },
    [gameRef, loadItemTooltipModule, showTooltipTags, tooltipPositionRef],
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

function getPlayerLockpickingLevel(state: GameState) {
  return state.player.skills.lockpicking.level;
}

function getTooltipLineCacheKey(
  playerLevel: number,
  lockpickingLevel: number,
  showTooltipTags: boolean,
) {
  return `${playerLevel}:${lockpickingLevel}:${Number(showTooltipTags)}`;
}
