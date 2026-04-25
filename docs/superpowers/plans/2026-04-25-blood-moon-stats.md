# Blood Moon Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Blood Moon enemies 10% stronger than their normal base stats and align tests plus reference docs with that behavior.

**Architecture:** Keep the existing Blood Moon state flow and HP-ratio preservation logic. Change only the stat multiplier semantics, then update deterministic tests and the shipped gameplay reference spec to match.

**Tech Stack:** TypeScript, Vitest, pnpm

---

### Task 1: Correct Blood Moon stat scaling

**Files:**

- Modify: `src/game/stateWorldEvents.test.ts`
- Modify: `src/game/config.ts`
- Modify: `src/game/combat.ts`
- Modify: `docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md`

- [ ] **Step 1: Write the failing test**

Change the Blood Moon test so it expects the sample enemy to become stronger:

```ts
expect(bloodMoonGame.enemies['enemy-test']?.maxHp).toBe(35);
expect(bloodMoonGame.enemies['enemy-test']?.attack).toBe(10);
expect(bloodMoonGame.enemies['enemy-test']?.defense).toBe(6);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:node -- src/game/stateWorldEvents.test.ts`
Expected: FAIL because current code scales stats down with `0.1`.

- [ ] **Step 3: Write minimal implementation**

Update the Blood Moon stat scale from `0.1` to `1.1` and keep using the shared stat-scaling helper.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:node -- src/game/stateWorldEvents.test.ts`
Expected: PASS

- [ ] **Step 5: Update docs and verify**

Update the reference spec to say Blood Moon scales enemy stats upward and rerun:

Run: `pnpm test:node -- src/game/stateWorldEvents.test.ts`
Expected: PASS
