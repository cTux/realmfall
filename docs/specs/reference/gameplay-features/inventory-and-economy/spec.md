# Inventory And Economy

## Scope

This spec covers inventory actions, gold handling, and town trading.

## Current Behavior

- Inventory supports sorting, dropping, consuming, equipping, recipe learning, and contextual actions.
- Prospecting converts equippable inventory items into value through the forge flow.
- Sell-all supports town-based liquidation of qualifying items.
- Gold is modeled as an inventory resource instead of a separate wallet field.
- Legacy save shapes with direct player gold are normalized into inventory gold during hydration.
- Towns provide a fixed deterministic stock based on seed and coordinate.
- Buying uses town stock entries with explicit prices.
- The current town economy covers basic survival consumables and starter-tier gear.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/economy.ts`
- `src/game/state.ts`
- `src/ui/components/InventoryWindow/InventoryWindowContent.tsx`
