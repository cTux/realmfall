# Inventory And Economy

## Scope

This spec covers inventory actions, gold handling, and town trading.

## Current Behavior

- Inventory supports sorting, dropping, consuming, equipping, recipe-page learning, and contextual actions.
- Recipe pages in inventory show a green border plus a blue translucent slot overlay while unlearned.
- Learned recipe pages add a red `Already learned` hint in their inventory tooltip, use a red inventory border, stay in the pack until sold or dropped, and route primary-click handling through the recipe-use flow so they show the dedicated already-known feedback instead of generic equip errors.
- Sellable item tooltips end with a coin-marked `Sells for N gold` line derived from the same town sell-value rules used by gameplay, including consumables and crafting materials.
- Stack-count badges remain fully visible on tinted and overlaid item slots.
- Equippable inventory items can be locked from the context menu so prospecting and sell-all ignore them, and locked items display a small padlock badge in their slot.
- While standing at a forge or town, eligible equippable inventory items expose item-context actions for single-item prospecting or selling, and recipe pages expose the town-only single-item sell action.
- While standing at a rune forge, mana font, or corruption altar, eligible non-corrupted equippable inventory items expose item-context actions for reforge, enchant, or corrupt flows directly from the inventory menu.
- Crafting materials carry a dedicated crafting-material tag, and their context menu can open the recipe book filtered to matching recipes with a reset-filter action in the book.
- Consumables are only spent when at least one of their effects would change the current player state.
- Using any consumable starts a shared `2s` consumable cooldown, and no other consumable can be used again until that cooldown expires.
- Prospecting converts equippable inventory items into value through the forge flow.
- While the hex info window is open at a forge or town, the bulk equippable prospect and sell actions surface a shared `Q` hotkey on the active button.
- Reforging, enchanting, and corrupting all consume gold through the same inventory-backed gold resource model used by town trading and prospecting.
- Corruption menu copy surfaces the item-break risk before the player commits to the action.
- Sell-all supports town-based liquidation of unlocked equippable inventory items.
- Gold is modeled as an inventory resource instead of a separate wallet field.
- Towns provide a deterministic stock based on seed, coordinate, and the current game day.
- Buying an item removes that specific town-stock entry from the active town list until the stock refreshes.
- Each town refreshes its selling list at the start of a new game day.
- Buying uses town stock entries with explicit prices, and town markups now scale sharply by item rarity so rare-to-legendary gear is much less affordable in the early game.
- Town item-shop prices render on the item card itself using the same bottom badge treatment as inventory stack counts, but with the gold coin-pile icon instead of a text suffix.
- Recipe pages can be sold individually in town for a premium value.
- Consumables and crafting materials can also be sold individually in town for cheap prices, with ingots worth more gold than raw ores.
- The current town economy covers basic survival consumables and starter-tier gear.

## Main Implementation Areas

- `src/game/inventory.ts`
- `src/game/economy.ts`
- `src/game/state.ts`
- `src/game/stateInventoryActions.ts`
- `src/game/stateItemModificationActions.ts`
- `src/ui/components/InventoryWindow/InventoryWindowContent.tsx`
