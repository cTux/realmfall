# Changelog

Game-facing release notes only. Tooling, CI, documentation, and other infrastructure-only changes are intentionally excluded.

## 0.0.0 - 2026-04-13

### World Exploration

- Explore a hex-based overworld with fog of war, location discovery, and Pixi-powered map rendering.
- Travel farther across the map with safe far-hex movement, home-hex navigation, and return-scroll support.
- Experience world-state pressure through the day and night cycle, blood moon events, and world-event hooks.

### Survival And Combat

- Manage early survival pressure with thirst and other core resource loops layered into moment-to-moment play.
- Fight enemy encounters through the timed combat flow with a dedicated combat window and clearer battle start controls.
- Use richer item and combat feedback through improved tooltip content and item comparisons.

### Progression, Economy, And Crafting

- Gather resources, collect loot, equip upgrades, earn gold, and interact with town services as part of the main survival RPG loop.
- Progress through recipes, crafting-related systems, and structured content definitions that support expanding game content.

### Interface And Windows

- Use a desktop-style interface with draggable windows for hero, skills, hex info, equipment, inventory, recipe book, combat, loot, logs, and docked controls.
- Keep secondary game UI responsive through lazy-loaded window content instead of forcing everything into the initial game load.
