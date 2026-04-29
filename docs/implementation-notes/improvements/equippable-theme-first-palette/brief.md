# Equippable Theme-First Palette

This note captures the approved transient design context for expanding
equippable inventory tint variation after the inventory color rework.

## Goal

- Increase equippable icon color variation across the full equipment catalog.
- Keep rarity-colored borders unchanged for equippables.
- Make theme or material identity the first visual read and slot family the
  second read.
- Keep non-equippable white borders and recipe-page green scroll-quill behavior
  unchanged.

## Approved Decisions

- Use the approved `Tight Family` direction with a low-intensity slot split.
- Detect expansion-set families from the stable current item-key prefixes:
  `ashen`, `dawn`, `dusk`, `ember`, `hollow`, `ironbound`, `moss`, `rift`,
  `shard`, `storm`, `vale`, `void`, and `warden`.
- Within one family, separate slot roles with nearby hues rather than wide
  jumps:
  - weapons and shields should sit in distinct metallic or combat-adjacent
    tones
  - headwear and cloaks should sit in nearby cloth or trim tones
  - jewelry and charms should keep a warm accent lane
  - boots, belts, gloves, and related utility slots should stay in grounded
    material-adjacent tones
- Apply the same theme-first rule to generic non-set equippables through a
  smaller archetype family map such as leather, cloth, metal, jewelry, and
  arcane.
- Unknown equippables should fall back to the existing neutral equippable tint
  instead of inventing a new family at runtime.

## Implementation Direction

- Keep the tint logic centralized in
  `packages/client/src/ui/icons.ts`.
- Replace the current broad `getEquippableTint` fallback switch with a shared
  palette helper that:
  - resolves an expansion theme family from the item key when possible
  - otherwise resolves a generic family from stable signals already available in
    the UI layer such as `itemKey`, `slot`, and explicit key patterns for
    jewelry, shields, wands, spheres, totems, and starter gear
  - applies a low-split slot-role variant inside that family
- Keep this as a UI-layer derivation rather than adding explicit tint metadata
  to every item config.
- Preserve the current neutral fallback path so new or unclassified equippables
  degrade safely.

## Verification Direction

- Extend `packages/client/src/ui/uiItemSlotColors.test.tsx` to cover
  representative expansion themes such as `ashen`, `dawn`, `storm`, and `void`
  with low-split variation across multiple slot families.
- Extend `packages/client/src/ui/helpers.test.tsx` to cover generic
  non-set equippables and the neutral fallback path for unknown gear.
- Keep recipe-page and non-equippable assertions intact so the previous
  inventory color rules remain covered.
- Refresh the relevant item-slot Storybook coverage to include themed
  equippables from multiple expansion families so the approved palette model is
  visible outside tests.
- Update the matching gameplay specs so the shipped behavior describes a
  theme-first, low-split equippable tint rule instead of the earlier
  real-world-color requirement.

## Canonical References

- `packages/client/src/ui/icons.ts`
- `packages/client/src/ui/uiItemSlotColors.test.tsx`
- `packages/client/src/ui/helpers.test.tsx`
- `packages/ui/src/components/ItemSlot/ItemSlotButton.stories.tsx`
- `docs/specs/reference/gameplay-features/inventory-and-economy/spec.md`
- `docs/specs/reference/gameplay-features/items-loot-and-equipment/spec.md`
- `docs/rules/30-react-ui.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
