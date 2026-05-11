import fc from 'fast-check';
import {
  normalizeLoadedGame,
  normalizeSavedUiItem,
} from './normalizePropertyTestkit';
import {
  buildItemFromConfig,
  getConsumableItemKeys,
  ITEM_CONFIGS,
} from '@realmfall/core/game/content/items';
import { createGame } from '@realmfall/core/game/stateFactory';
import { RARITY_ORDER } from '@realmfall/core/game/stateTypes';

const ALL_ITEM_KEYS = ITEM_CONFIGS.map((config) => config.key) as [
  string,
  ...string[],
];
const CONSUMABLE_ITEM_KEYS = getConsumableItemKeys() as [string, ...string[]];
const REQUIRED_NUMERIC_FIELDS = [
  'quantity',
  'tier',
  'power',
  'defense',
  'maxHp',
  'healing',
] as const;

describe('normalize property invariants', () => {
  it('round-trips fresh saves across seeds and radii', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ maxLength: 32 }),
        (radius, seed) => {
          const game = createGame(radius, seed);

          expect(normalizeLoadedGame(structuredClone(game))).toEqual({
            ...game,
            logs: [],
          });
        },
      ),
      { numRuns: 40 },
    );
  });

  it('restores canonical consumable config values from saved ui items', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CONSUMABLE_ITEM_KEYS),
        fc.string({ minLength: 1, maxLength: 32 }),
        fc.integer({ min: 1, max: 99 }),
        fc.string({ maxLength: 32 }),
        fc.constantFrom(...RARITY_ORDER),
        (itemKey, id, quantity, name, rarity) => {
          const configured = ITEM_CONFIGS.find(
            (config) => config.key === itemKey,
          );
          const normalized = normalizeSavedUiItem({
            ...buildItemFromConfig(itemKey, { id, quantity }),
            name,
            rarity,
          });

          expect(normalized).toEqual(
            expect.objectContaining({
              id,
              itemKey,
              quantity,
              name: configured?.name,
              rarity: configured?.rarity,
            }),
          );
        },
      ),
      { numRuns: 60 },
    );
  });

  it('rejects non-finite required numeric item fields across configured items', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ITEM_KEYS),
        fc.string({ minLength: 1, maxLength: 32 }),
        fc.constantFrom(...REQUIRED_NUMERIC_FIELDS),
        fc.constantFrom(
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ),
        (itemKey, id, field, invalidNumber) => {
          const item = buildItemFromConfig(itemKey, { id });
          const malformed = {
            ...item,
            [field]: invalidNumber,
          };

          expect(normalizeSavedUiItem(malformed)).toBeNull();
        },
      ),
      { numRuns: 80 },
    );
  });
});
