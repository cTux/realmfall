# Persistence Rules

## Persistence

- Do not add backward save-format compatibility yet. Load persisted game and UI state as-is, and clear browser save storage after major save-shape changes instead of adding migration code.
- Treat `src/persistence/storage.ts` and similar local save protection as obfuscation, not real security. Do not describe client-side passphrase-based storage as secure encryption or meaningful secret protection.
- Keep persistence concerns isolated from core game rules when possible.
- Keep gameplay saves on the asynchronous IndexedDB path when browser support is available. Use `localStorage` only as a compatibility fallback or migration bridge, not as the primary autosave write target.
- When runtime systems remove display-name fallbacks for configured content, allow hydration to backfill missing canonical ids only when the mapping comes directly from the live content registry and lands the save on the current runtime model before gameplay code runs.
- Prefer debounced or meaningfully-triggered autosave work over repeated full serialization and storage writes on every eligible change.
- When autosave work is not user-blocking, prefer scheduling snapshot assembly and flush work through idle browser callbacks or equivalent deferred execution instead of competing directly with live interaction.
- Track gameplay persistence dirtiness separately from UI layout, window-visibility, and filter persistence dirtiness when that keeps narrow UI-only changes from rebuilding full gameplay snapshots.
- If gameplay and UI persistence share one stored payload, keep their serialization, dirty detection, or snapshot assembly paths narrow enough that UI-only changes do not force avoidable gameplay snapshot rebuilds.
- Keep `src/app/App/useAppPersistence.ts` focused on hydration and current-input wiring. Extract autosave scheduling, snapshot assembly, and similar single-purpose save helpers into local modules under `src/app/App/persistence/` instead of growing one broad persistence hook.
- Avoid rewriting identical save payloads when no persisted state meaningfully changed.
