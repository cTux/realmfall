import type { Decorator } from '@storybook/react-vite';
import {
  createGame,
  getRecipeBookEntries,
  getPlayerStats,
  getRecipeBookRecipes,
  Skill,
} from '../../../game/state';
import { EquipmentSlotId } from '../../../game/content/ids';
import { addLog } from '../../../game/logs';
import {
  buildItemFromConfig,
  getItemConfigCategory,
  ITEM_CONFIGS,
} from '../../../game/content/items';
import { ENEMY_CONFIGS } from '../../../game/content/enemies';
import { STRUCTURE_CONFIGS } from '../../../game/content/structures';
import { DEFAULT_LOG_FILTERS } from '../../../app/constants';
import type {
  Equipment,
  EquipmentSlot,
  Item,
  LogEntry,
  LogKind,
  RecipeBookEntry,
  SkillName,
} from '../../../game/state';
import { WINDOW_LABELS } from '../../windowLabels';
import { Icons } from '../../icons';
import type { WindowDockEntry } from '../WindowDock/WindowDock';

export const STORYBOOK_WINDOW_POSITION = { x: 64, y: 48 };

export const storySurfaceDecorator: Decorator = (Story) => (
  <div style={{ minHeight: '100vh', padding: '24px' }}>
    <Story />
  </div>
);

export function storyPanelDecorator(maxWidth = '420px'): Decorator {
  return (Story) => (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ width: `min(${maxWidth}, calc(100vw - 48px))` }}>
        <Story />
      </div>
    </div>
  );
}

export function createStorybookFixtures() {
  const state = createGame(4, 'storybook-fixtures');
  const equipment = buildEquipmentFixture();
  const inventory = buildInventoryFixture();
  const loot = buildLootFixture();

  state.worldTimeMs = 46_000;
  state.player.level = 7;
  state.player.masteryLevel = 2;
  state.player.xp = 118;
  state.player.hp = 29;
  state.player.mana = 10;
  state.player.hunger = 24;
  state.player.thirst = 18;
  state.player.statusEffects = [{ id: 'restoration' }, { id: 'recentDeath' }];
  state.player.skills = {
    [Skill.Gathering]: { level: 6, xp: 4 },
    [Skill.Logging]: { level: 8, xp: 7 },
    [Skill.Mining]: { level: 6, xp: 5 },
    [Skill.Skinning]: { level: 5, xp: 2 },
    [Skill.Fishing]: { level: 4, xp: 6 },
    [Skill.Cooking]: { level: 7, xp: 1 },
    [Skill.Smelting]: { level: 5, xp: 4 },
    [Skill.Crafting]: { level: 9, xp: 3 },
  };
  state.player.equipment = equipment;
  state.player.inventory = inventory;
  state.player.learnedRecipeIds = getRecipeBookRecipes().map(
    (recipe) => recipe.id,
  );

  addLog(
    state,
    'movement',
    'You crossed the Ashen Span toward the old watchfires.',
  );
  addLog(
    state,
    'combat',
    'A marauder scout broke under a flurry of spear thrusts.',
    [
      { kind: 'entity', text: 'Marauder Scout', rarity: 'rare' },
      { kind: 'text', text: ' takes ' },
      { kind: 'damage', text: '14' },
      {
        kind: 'text',
        text: ' from ',
      },
      {
        kind: 'source',
        text: 'Fireball',
        source: { kind: 'ability', abilityId: 'fireball', attack: 18 },
      },
      { kind: 'text', text: '.' },
    ],
  );
  addLog(
    state,
    'loot',
    'Recovered a copper loop and a satchel of dried herbs.',
  );
  addLog(
    state,
    'survival',
    'You drank from a rain barrel and steadied your breath.',
  );
  addLog(state, 'system', 'Autosave stabilized the current expedition state.');

  const recipes = getRecipeBookEntries(state.player.learnedRecipeIds);
  const inventoryCountsByItemKey = countInventoryByItemKey(inventory);

  return {
    defaultFilters: { ...DEFAULT_LOG_FILTERS },
    dockEntries: buildWindowDockEntries(),
    enemies: ENEMY_CONFIGS,
    equipment,
    heroStats: getPlayerStats(state.player),
    inventory,
    inventoryCountsByItemKey,
    items: ITEM_CONFIGS,
    logs: state.logs as LogEntry[],
    loot,
    recipes,
    skills: state.player.skills as Record<
      SkillName,
      { level: number; xp: number }
    >,
    structures: STRUCTURE_CONFIGS,
    thirst: state.player.thirst,
    worldTimeMs: state.worldTimeMs,
  };
}

export function countInventoryByItemKey(items: Item[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = item.itemKey;
    if (!key) {
      return counts;
    }
    counts[key] = (counts[key] ?? 0) + item.quantity;
    return counts;
  }, {});
}

function buildInventoryFixture() {
  return ITEM_CONFIGS.map((config, index) =>
    buildItemFromConfig(config.key, {
      id: `inventory-${config.key}-${index}`,
      quantity:
        getItemConfigCategory(config) === 'resource' ? (index % 4) + 1 : 1,
    }),
  );
}

function buildLootFixture() {
  return ITEM_CONFIGS.slice(-8).map((config, index) =>
    buildItemFromConfig(config.key, {
      id: `loot-${config.key}-${index}`,
      quantity: getItemConfigCategory(config) === 'resource' ? 2 : 1,
    }),
  );
}

function buildEquipmentFixture(): Equipment {
  return {
    [EquipmentSlotId.Weapon]: buildEquippedItem(EquipmentSlotId.Weapon),
    [EquipmentSlotId.Offhand]: buildEquippedItem(EquipmentSlotId.Offhand),
    [EquipmentSlotId.Head]: buildEquippedItem(EquipmentSlotId.Head),
    [EquipmentSlotId.Shoulders]: buildEquippedItem(EquipmentSlotId.Shoulders),
    [EquipmentSlotId.Chest]: buildEquippedItem(EquipmentSlotId.Chest),
    [EquipmentSlotId.Bracers]: buildEquippedItem(EquipmentSlotId.Bracers),
    [EquipmentSlotId.Hands]: buildEquippedItem(EquipmentSlotId.Hands),
    [EquipmentSlotId.Belt]: buildEquippedItem(EquipmentSlotId.Belt),
    [EquipmentSlotId.Legs]: buildEquippedItem(EquipmentSlotId.Legs),
    [EquipmentSlotId.Feet]: buildEquippedItem(EquipmentSlotId.Feet),
    [EquipmentSlotId.RingLeft]: buildEquippedItem(EquipmentSlotId.RingLeft),
    [EquipmentSlotId.RingRight]: buildEquippedItem(EquipmentSlotId.RingRight),
    [EquipmentSlotId.Amulet]: buildEquippedItem(EquipmentSlotId.Amulet),
    [EquipmentSlotId.Cloak]: buildEquippedItem(EquipmentSlotId.Cloak),
  };
}

function buildEquippedItem(slot: EquipmentSlot) {
  const config = ITEM_CONFIGS.find((candidate) => candidate.slot === slot);
  if (!config) return undefined;
  return buildItemFromConfig(config.key, {
    id: `equipped-${slot}`,
  });
}

function buildWindowDockEntries(): WindowDockEntry[] {
  return [
    {
      key: 'hero',
      label: WINDOW_LABELS.hero.plain,
      title: WINDOW_LABELS.hero,
      icon: Icons.Player,
      shown: true,
    },
    {
      key: 'skills',
      label: WINDOW_LABELS.skills.plain,
      title: WINDOW_LABELS.skills,
      icon: Icons.Sparkles,
      shown: false,
    },
    {
      key: 'recipes',
      label: WINDOW_LABELS.recipes.plain,
      title: WINDOW_LABELS.recipes,
      icon: Icons.BookCover,
      shown: true,
    },
    {
      key: 'hexInfo',
      label: WINDOW_LABELS.hexInfo.plain,
      title: WINDOW_LABELS.hexInfo,
      icon: Icons.Village,
      shown: false,
    },
    {
      key: 'equipment',
      label: WINDOW_LABELS.equipment.plain,
      title: WINDOW_LABELS.equipment,
      icon: Icons.Armor,
      shown: true,
    },
    {
      key: 'inventory',
      label: WINDOW_LABELS.inventory.plain,
      title: WINDOW_LABELS.inventory,
      icon: Icons.Coins,
      shown: false,
    },
    {
      key: 'log',
      label: WINDOW_LABELS.log.plain,
      title: WINDOW_LABELS.log,
      icon: Icons.TiedScroll,
      shown: true,
    },
    {
      key: 'settings',
      label: WINDOW_LABELS.settings.plain,
      title: WINDOW_LABELS.settings,
      icon: Icons.Gears,
      shown: false,
      align: 'end',
    },
  ];
}

export const noop = () => undefined;

export function createLogFilters(
  overrides: Partial<Record<LogKind, boolean>> = {},
) {
  return {
    ...DEFAULT_LOG_FILTERS,
    ...overrides,
  };
}

export function createRecipeBookArgs(recipes: RecipeBookEntry[]) {
  return {
    currentStructure: 'forge' as const,
    recipes,
    recipeSkillLevels: {
      [Skill.Gathering]: 1,
      [Skill.Logging]: 1,
      [Skill.Mining]: 1,
      [Skill.Skinning]: 1,
      [Skill.Fishing]: 1,
      [Skill.Cooking]: 1,
      [Skill.Smelting]: 1,
      [Skill.Crafting]: 1,
    },
  };
}
