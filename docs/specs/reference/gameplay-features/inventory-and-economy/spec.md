# Inventory And Economy

## Scope

This spec covers inventory actions, gold handling, and town trading.

## Current Behavior

- Inventory supports sorting, dropping, consuming, equipping, recipe-page learning, and contextual actions.
- Recipe pages in inventory tint blue while still unlearned.
- Equippable inventory items can be locked from the context menu so prospecting and sell-all ignore them, and locked items display a small padlock badge in their slot.
- While standing at a forge or town, eligible equippable inventory items expose item-context actions for single-item prospecting or selling.
- Crafting materials carry a dedicated crafting-material tag, and their context menu can open the recipe book filtered to matching recipes with a reset-filter action in the book.
- Consumables are only spent when at least one of their effects would change the current player state.
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
