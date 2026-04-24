# Save Hydration Default Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve player saves across runtime save-shape growth by hydrating against current defaults and falling back per field instead of discarding the full gameplay save.

**Architecture:** Replace the all-or-nothing gameplay save validator with a sanitizer that starts from a fresh runtime `createGame(...)` baseline and selectively applies valid persisted values. Keep UI hydration independent, preserve the current narrow compatibility hooks, and add regression tests that prove missing or invalid gameplay branches no longer wipe the save.

**Tech Stack:** TypeScript, React, Vitest, existing app normalization and persistence helpers.

---

### Task 1: Lock In Failing Hydration Regressions

**Files:**

- Modify: `src/app/normalize.test.ts`
- Modify: `src/app/App/tests/useAppPersistence.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
it('fills missing skills from current runtime defaults while preserving saved progress', () => {
  const game = createGame(3, 'normalize-missing-skill-seed');
  const saved = structuredClone(game);

  delete (saved.player.skills as Partial<typeof saved.player.skills>).crafting;
  saved.player.skills.gathering = { level: 7, xp: 123 };

  const normalized = normalizeLoadedGame(saved);

  expect(normalized?.player.skills.gathering).toEqual({ level: 7, xp: 123 });
  expect(normalized?.player.skills.crafting).toEqual(
    game.player.skills.crafting,
  );
});

it('falls back invalid nested player fields to defaults instead of rejecting the save', () => {
  const game = createGame(3, 'normalize-invalid-player-field-seed');
  const saved = structuredClone(game) as typeof game & {
    player: typeof game.player & { hunger: unknown };
  };

  saved.player.hunger = 'bad-value';
  saved.player.level = 9;

  const normalized = normalizeLoadedGame(saved);

  expect(normalized?.player.level).toBe(9);
  expect(normalized?.player.hunger).toBe(game.player.hunger);
});

it('keeps the saved game slice when hydration falls back missing gameplay fields to defaults', async () => {
  const game = createGame(2, 'use-app-persistence-default-fallback-seed');
  const saved = structuredClone(game);

  delete (saved.player.skills as Partial<typeof saved.player.skills>).crafting;
  saved.player.level = 8;

  loadEncryptedState.mockResolvedValue({ game: saved, ui: {} });
  saveEncryptedState.mockResolvedValue(undefined);

  const { handle, host, root } = await renderPersistenceHarness();

  expect(host.querySelector('[data-hydrated="ready"]')).toBeTruthy();

  await act(async () => {
    await flushAutosaveTimers();
  });

  expect(saveEncryptedState).toHaveBeenCalledWith({
    game: expect.objectContaining({
      player: expect.objectContaining({
        level: 8,
        skills: expect.objectContaining({
          crafting: game.player.skills.crafting,
        }),
      }),
    }),
  });

  await act(async () => {
    root.unmount();
  });
  host.remove();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/app/normalize.test.ts src/app/App/tests/useAppPersistence.test.tsx`
Expected: FAIL because `normalizeLoadedGame()` rejects missing or invalid gameplay branches instead of filling defaults.

- [ ] **Step 3: Commit the failing test baseline**

```bash
git add src/app/normalize.test.ts src/app/App/tests/useAppPersistence.test.tsx
git commit -m "test: cover save hydration default fallbacks"
```

### Task 2: Refactor Gameplay Normalization Around Runtime Defaults

**Files:**

- Modify: `src/app/normalizeGameState.ts`
- Modify: `src/app/normalizeCompatibility.ts`
- Modify: `src/app/normalizeShared.ts`
- Reference: `src/game/stateFactory.ts`
- Reference: `src/game/stateTypes.ts`

- [ ] **Step 1: Add a fresh-game baseline helper**

```ts
import { createGame } from '../game/stateFactory';
import { WORLD_RADIUS } from './constants';

function createNormalizationBaseline(saved: Record<string, unknown>) {
  const radius =
    typeof saved.radius === 'number' && Number.isFinite(saved.radius)
      ? saved.radius
      : WORLD_RADIUS;
  const seed =
    typeof saved.seed === 'string' && saved.seed.length > 0
      ? saved.seed
      : 'hydrated-save';

  return createGame(radius, seed);
}
```

- [ ] **Step 2: Change `normalizeLoadedGame()` to sanitize onto the baseline instead of returning `null` for missing branches**

```ts
export function normalizeLoadedGame(game: unknown): GameState | null {
  if (!isRecord(game)) {
    return null;
  }

  const baseline = createNormalizationBaseline(game);
  const player = normalizePlayer(game.player, baseline.player);
  const tiles = normalizeTiles(game.tiles, baseline.tiles);
  const enemies = normalizeEnemies(game.enemies, baseline.enemies);
  const combat = normalizeCombatState(game.combat) ?? baseline.combat;

  return {
    ...baseline,
    seed: typeof game.seed === 'string' ? game.seed : baseline.seed,
    radius: isFiniteNumber(game.radius) ? game.radius : baseline.radius,
    homeHex: normalizeHexCoord(game.homeHex) ?? baseline.homeHex,
    turn: isFiniteNumber(game.turn) ? game.turn : baseline.turn,
    worldTimeMs: isFiniteNumber(game.worldTimeMs)
      ? game.worldTimeMs
      : baseline.worldTimeMs,
    dayPhase: isDayPhase(game.dayPhase) ? game.dayPhase : baseline.dayPhase,
    player,
    tiles,
    enemies,
    combat,
    logs: [],
  };
}
```

- [ ] **Step 3: Update nested normalizers to accept defaults and fall back per field**

```ts
function normalizePlayer(
  value: unknown,
  fallback: GameState['player'],
): GameState['player'] {
  if (!isRecord(value)) {
    return fallback;
  }

  return syncPlayerBaseStats({
    coord: normalizeHexCoord(value.coord) ?? fallback.coord,
    level: isFiniteNumber(value.level) ? value.level : fallback.level,
    masteryLevel: isFiniteNumber(value.masteryLevel)
      ? value.masteryLevel
      : fallback.masteryLevel,
    xp: isFiniteNumber(value.xp) ? value.xp : fallback.xp,
    hp: isFiniteNumber(value.hp) ? value.hp : fallback.hp,
    baseMaxHp: isFiniteNumber(value.baseMaxHp)
      ? value.baseMaxHp
      : fallback.baseMaxHp,
    mana: isFiniteNumber(value.mana) ? value.mana : fallback.mana,
    baseMaxMana: isFiniteNumber(value.baseMaxMana)
      ? value.baseMaxMana
      : fallback.baseMaxMana,
    hunger: isFiniteNumber(value.hunger) ? value.hunger : fallback.hunger,
    thirst: isFiniteNumber(value.thirst) ? value.thirst : fallback.thirst,
    baseAttack: isFiniteNumber(value.baseAttack)
      ? value.baseAttack
      : fallback.baseAttack,
    baseDefense: isFiniteNumber(value.baseDefense)
      ? value.baseDefense
      : fallback.baseDefense,
    skills: normalizeSkills(value.skills, fallback.skills),
    learnedRecipeIds: isStringArray(value.learnedRecipeIds)
      ? [...value.learnedRecipeIds]
      : [...fallback.learnedRecipeIds],
    inventory: normalizeItems(value.inventory) ?? fallback.inventory,
    equipment: normalizeEquipment(value.equipment, fallback.equipment),
    statusEffects:
      normalizeStatusEffects(value.statusEffects) ?? fallback.statusEffects,
  });
}
```

- [ ] **Step 4: Run the focused tests**

Run: `pnpm vitest run src/app/normalize.test.ts src/app/App/tests/useAppPersistence.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/normalizeGameState.ts src/app/normalizeCompatibility.ts src/app/normalizeShared.ts src/app/normalize.test.ts src/app/App/tests/useAppPersistence.test.tsx
git commit -m "fix: preserve saves with default hydration fallbacks"
```

### Task 3: Update Persistence Documentation

**Files:**

- Modify: `docs/rules/20-persistence.md`
- Modify: `docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md`

- [ ] **Step 1: Update the project rule**

```md
- Preserve persisted gameplay saves across additive save-shape changes by hydrating onto current runtime defaults and falling back per field for missing or invalid values.
```

- [ ] **Step 2: Update the technical spec**

```md
- Gameplay hydration uses the current runtime default game state as the canonical baseline, then applies valid persisted values field-by-field so additive save-shape changes do not wipe player progress.
- Missing or invalid persisted gameplay values fall back to current defaults instead of rejecting the entire gameplay save.
- The app does not depend on explicit save schema version checks for additive gameplay save evolution.
```

- [ ] **Step 3: Run the focused verification again**

Run: `pnpm vitest run src/app/normalize.test.ts src/app/App/tests/useAppPersistence.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/rules/20-persistence.md docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md
git commit -m "docs: describe default-based save hydration"
```
