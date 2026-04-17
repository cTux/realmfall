# React UI Rules

## React UI

- Follow the existing window-based desktop-style UI instead of introducing unrelated navigation patterns.
- Keep heavy app coordination in dedicated hooks when possible, following patterns already used in `src/app/App`.
- Keep component-only hooks in a colocated `hooks/` directory when just one component or feature uses them.
- When reducing React rerender fanout, move window-specific derivation, dock composition, and stable window handler ownership out of `src/app/App/App.tsx` and into narrower hooks or the window composition layer when that keeps unrelated windows from recomputing together.
- Do not let `src/app/App/App.tsx` rebuild broad nested `layout`, `views`, or `actions` object graphs inline once that data can be composed in narrower hooks or neighboring modules.
- Avoid force-casting partial selector inputs to `GameState` in React view-model hooks. Use narrow selector input types and variable names that match the actual data shape being passed.
- Keep Storybook stories for every component under `src/ui/components`, including shared leaf components and window wrappers.
- Every component addition, removal, or behavior-affecting UI change should add or update the corresponding Storybook story in the same task.
- Keep aggregate Storybook catalogs for entity dictionaries such as `ITEM_CONFIGS`, `ENEMY_CONFIGS`, and `STRUCTURE_CONFIGS`, and prefer rendering those catalogs directly from the live config arrays so entity additions, removals, and edits appear automatically.
- Prefer maximally reusable UI components and helpers. When multiple windows or controls share the same structure or behavior, reuse or extend a shared primitive instead of maintaining parallel implementations.
- Keep user-facing UI copy in i18n resources instead of inline string literals in components, gameplay modules, or content definitions.
- Default to `en` and keep locale resources lazy-loadable so additional languages can stay off the initial path when they are not needed.
- Load i18n before importing `src/app/App` during bootstrap. The app import graph contains module-level localized constants, so importing `App` before translations are ready can freeze raw i18n keys into runtime state on a cold start.
- When new user-facing text is required, add a new i18n key instead of hardcoding a fallback string in code.
- Keep tooltip sentence assembly, tag labels, and similar UI helper copy in i18n-backed formatters instead of embedding English fragments in `src/ui/tooltips.ts` or similar helper modules.
- Use dot-separated i18n keys in the form `{feature}.{area}.{property}` and extend with deeper segments only when needed for clarity.
- For label formatters that map stable identifiers such as status effects to i18n, prefer direct patterned key lookups over conditional `if` or `switch` chains when the key can be derived safely.
- Lazy-load secondary UI only when it matches the existing usage pattern and helps keep the initial app path lighter.
- Treat draggable window content as secondary UI by default. New windows should defer their content behind a lazy-loaded bundle, either by lazy-loading the whole window module or by lazy-loading a dedicated `*WindowContent` module inside the window component.
- Preserve existing React containment patterns such as memoized window components when extending the current UI.
- Maintain mobile-aware and desktop-safe behavior when changing interactions, even if the full mobile adaptation is still incomplete.
- Keep component files under roughly `250` lines when practical. When a component grows past that size, prefer splitting view models, hooks, or subcomponents into neighboring files.
- Keep high-frequency pointer, hover, and world-interaction updates off broad React state paths when refs, invalidation flags, or narrower state can avoid avoidable rerenders.
- Deduplicate `pointermove` world-hover work by hovered hex before doing heavier interaction logic, and avoid rerunning tooltip derivation, enemy lookups, or pathfinding while the pointer stays on the same tile.
- On the world-hover path, only run pathfinding, enemy tooltip derivation, or similar heavier selectors when the hovered tile is actually actionable.
- For follow-cursor world tooltips, reuse the existing world-hover pipeline to push position updates instead of adding a separate global pointer listener just to move the tooltip DOM.
- Keep component modules compatible with React Fast Refresh expectations; move shared non-component exports out of component files when needed.
- Keep shared window labels, hotkey metadata, and similar reusable UI constants in plain non-component modules so component files only export component concerns.
- Window title bars should reuse shared controls wherever possible. Close actions must use the shared close button implementation and surface the shared custom tooltip consistently across every window.
- For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape. If sourcing icons externally, prefer transparent exports or strip the background path before committing so the UI does not render a solid square.
- For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently so browser-default tooltips never compete with or duplicate the in-game tooltip.
