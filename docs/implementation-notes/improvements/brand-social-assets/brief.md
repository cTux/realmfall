# Brand Social Assets

Active design note for the Realmfall favicon and square social avatar refresh.

Canonical references:

- [Rules](../../../RULES.md)
- [Documentation Rules](../../../rules/61-documentation.md)
- [Lore](../../../lore/REALMFALL.md)

## Goal

Regenerate Realmfall's favicon set and square Telegram or Discord channel
avatar in one coherent style.

## Approved Direction

- Use an emblem-first identity system built around a cold arcane `Warden
Compass` silhouette.
- Keep the outer emblem as a silver circular ring with eight compass-like
  points.
- Use a hollow hex gate as the center instead of a rotated square or diamond.
- Keep the palette strictly blue and silver.
- Do not use orange, ember accents, text, character art, or painterly clutter
  in the core mark.

## Deliverables

- One light-surface favicon variant for light browser chrome.
- One dark-surface favicon variant for dark browser chrome.
- One square social avatar for Telegram and Discord.

## Shared Visual Language

- Every deliverable must use the same central emblem so the favicon and social
  avatar read as one family.
- The favicon variants should prioritize tiny-size readability over atmosphere:
  bold compass points, a clean circular ring, and a clearly readable hollow hex
  center.
- The square social avatar should keep the exact same emblem and place it in a
  richer square field with restrained blue mist, soft radial light, and enough
  negative space to preserve recognition at small platform sizes.

## Per-Asset Treatment

- The light favicon should use darker steel and sapphire values so the mark
  holds on white or light browser surfaces.
- The dark favicon should use brighter silver and ice-blue values so the mark
  holds on dark browser surfaces.
- The square social avatar should use a dark blue-slate background with subtle
  atmospheric depth, but it should not add secondary symbols or alter the core
  silhouette.

## Tone And Constraints

- The assets should feel premium, cold, arcane, and slightly exploratory.
- The system should avoid generic esports-badge energy by keeping the rendering
  controlled and the shape language grounded in Realmfall's fractured-world
  identity.
- The center hex should read as a stabilized gate or anchor aperture rather
  than a gem, shield boss, or loot emblem.

## Acceptance Criteria

- The favicon mark remains legible and recognizable at 16 to 32 px.
- The hollow hex center remains readable in both light and dark favicon
  variants.
- The square avatar is clearly the same brand mark, not a separate logo.
- The final exports replace or sit beside the current favicon assets
  non-destructively unless replacement is requested explicitly.
- The resulting images feel aligned with Realmfall's lore of fractured shards,
  stabilization, and arcane navigation without reverting to the previous
  blue-orange split identity.

## Expected Repo Touchpoints

- `packages/client/src/assets/favicons/`
- Any additional social-avatar asset location selected during implementation.
- `packages/client/index.html` if the favicon filenames or references change.

## Verification Direction

- Check the favicon exports against both light and dark browser surfaces.
- Validate the social avatar at small square sizes typical for Telegram and
  Discord channel listings.
- Keep any generated asset filenames or replacements explicit in the
  implementation summary.
