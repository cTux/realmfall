# Persistence Rules

## Persistence

- Preserve the normalize-before-hydrate pattern for save compatibility. If persisted data shape changes, update normalization instead of assuming fresh saves.
- Treat `src/persistence/storage.ts` and similar local save protection as obfuscation, not real security. Do not describe client-side passphrase-based storage as secure encryption or meaningful secret protection.
- Keep persistence concerns isolated from core game rules when possible.
- Prefer debounced or meaningfully-triggered autosave work over repeated full serialization and storage writes on every eligible change.
- Track gameplay persistence dirtiness separately from UI layout, window-visibility, and filter persistence dirtiness when that keeps narrow UI-only changes from rebuilding full gameplay snapshots.
- If gameplay and UI persistence still share one stored payload, keep their serialization, dirty detection, or snapshot assembly paths narrow enough that UI-only changes do not force avoidable gameplay snapshot rebuilds.
- Avoid rewriting identical save payloads when no persisted state meaningfully changed.
