# User Action Log Design

## Summary

Reflect intentional user commands in the existing log window so the player can
see both what they attempted and what happened. The change must use the current
`game.logs` feed rather than creating a new panel or debug-only stream.

This design explicitly excludes passive interaction noise such as hover updates,
window dragging, map panning, zooming, and filter toggles. Only intentional
commands that invoke an action or change state should produce a user-action log
entry.

## Goals

- Show intentional user commands in the existing log window.
- Keep command visibility separate from low-signal pointer and window noise.
- Reuse the existing game log infrastructure so filtering, persistence, and UI
  rendering continue to work without a second log system.
- Keep logging logic centralized enough that new commands can opt in without
  repeating ad hoc string-building across the app.

## Non-Goals

- Add a separate action log window, debug console, or telemetry pipeline.
- Log raw input events such as pointer movement, hover changes, wheel gestures,
  or key presses that do not trigger a command.
- Retroactively infer commands by diffing arbitrary state updates.
- Replace existing gameplay-result logs such as combat, movement, or world
  event messages.

## Current Context

The app already has one canonical in-game log feed driven by
`src/game/logs.ts`. Many gameplay mutations append domain-result messages there,
but several user-triggered command paths do not currently add an explicit
"player chose to do X" entry.

Intentional commands currently fan through a few primary layers:

- `src/app/App/hooks/useGameActionHandlers.ts` for most gameplay mutations.
- `src/app/App/hooks/useActionBarController.ts` for action-bar item use.
- `src/app/App/useKeyboardShortcuts.ts` for key-triggered command dispatch.
- `src/app/App/hooks/useAppWindowActions.ts` as the grouped window-action
  surface consumed by UI windows.
- `src/app/App/world/pixiWorldInteractions.ts` for actionable world click
  dispatch.

The existing log window already renders `game.logs`, so the design should add
entries into that stream instead of introducing a parallel view model.

## Recommended Approach

Add a shared app-level command logging wrapper around intentional command
handlers. The wrapper should accept:

- a human-readable command description builder
- the gameplay transition or state-changing callback to execute
- a policy for whether the command should log only on change or on invocation

This wrapper should be used by the app-layer command entrypoints that represent
intentional user actions. It should append a log entry into `game.logs` through
the existing `addLog` helper when the command qualifies.

This approach is preferred over inline logging at every handler because it keeps
the policy centralized, reduces duplicate phrasing, and makes it easier to
avoid double-logging when multiple input paths trigger the same command.

## Logging Policy

### Included commands

Included commands are intentional actions that either invoke a meaningful game
command or change application state in a player-visible way. Examples include:

- interacting with a structure
- claiming or unclaiming the current hex
- setting home
- healing at a faction NPC
- starting or forfeiting combat
- buying, selling, prospecting, sorting, crafting, equipping, unequipping,
  dropping, consuming, enchanting, corrupting, reforging, and locking items
- taking one or all loot items
- using an action-bar slot when a valid item is assigned
- actionable world-click movement or equivalent world command dispatch

### Excluded interactions

Excluded interactions are low-signal UI or input behaviors that do not
represent a command. Examples include:

- pointer hover and tooltip updates
- window open, close, move, resize, and focus changes
- log filter toggles
- map drag and zoom gestures
- key presses that do not trigger a command
- failed action-bar usage when no valid item exists in the selected slot

### When to append a command log

By default, append a command log only when the command causes a meaningful state
change or successfully invokes the intended action path. If a handler returns
without performing work, no extra command log should be added.

This prevents noise such as:

- duplicate entries from non-actionable clicks
- command text for unavailable actions
- extra entries for UI helpers that exit early

Some commands may already produce a gameplay-result log from the game domain.
That is acceptable. The command log answers "what the player tried to do," while
the gameplay log answers "what happened."

## Log Shape and Presentation

Command logs should use the existing `game.logs` array and existing log-window
rendering path.

Recommended behavior:

- Add a dedicated `LogKind` for user commands if the current kind set can
  support a new filtered category cleanly.
- If adding a new log kind would expand filter and persistence surface too
  broadly for this change, reuse the closest existing non-combat player-action
  kind and keep the command text clearly prefixed.

Preferred command phrasing should be short, present tense, and player-centered,
for example:

- `You command: interact with the ruin.`
- `You command: use Minor Healing Potion.`
- `You command: start combat.`

The phrasing should be generated from canonical action context where possible,
not duplicated as hand-maintained string literals across many UI components.

## Architecture

### App-layer helper

Add a focused helper near the app action hooks that wraps intentional command
dispatch. It should stay in `src/app/App/hooks` or a nearby app-local helper
module so command logging remains an app orchestration concern rather than a
core gameplay rule.

Responsibilities:

- execute the requested app command
- compare pre/post conditions when needed
- append a command log entry through existing game log helpers
- avoid logging when the command did not actually run

### Game log integration

Continue to use `src/game/logs.ts` as the canonical log-entry constructor. If
the existing `addLog` helper is sufficient, reuse it directly. If the app needs
slightly narrower command-oriented helpers, add a thin neighbor helper instead
of duplicating log-entry construction in the app layer.

### Command coverage

Update the command paths that represent explicit user intent:

- gameplay mutation handlers in `useGameActionHandlers`
- action-bar command execution in `useActionBarController`
- actionable world-click navigation or command dispatch in the Pixi world input
  modules

Do not expand this change into broad window-state or tooltip logging.

## Error Handling and Edge Cases

- If a command path determines the action is unavailable, do not add a command
  log entry.
- If a gameplay transition returns the original state object or leaves the
  relevant state unchanged, treat it as no command log unless that command is
  explicitly marked as invocation-only.
- If one user command triggers both a command log and an existing gameplay
  result log, preserve both entries.
- If repeated key input is intentionally suppressed today, command logging must
  respect that suppression and must not create repeated entries on ignored key
  repeats.

## Testing

Add or update colocated tests for the command surfaces that gain logging.

Coverage should verify:

- intentional commands add an entry to `game.logs`
- excluded UI-only actions do not add command logs
- commands that fail early or have no actionable target do not log
- action-bar slot usage logs only when a valid item is found
- actionable world input logs when it dispatches the mapped command
- existing gameplay logs remain intact alongside the new command entries

Use the narrowest suitable test project:

- `node` tests for pure gameplay or helper behavior
- `jsdom` tests for browser-surface command paths such as app hooks or world
  input integration

## Implementation Notes

- Prefer a small central helper over spreading command logging into every
  component callback.
- Keep `src/app/App/App.tsx` untouched unless wiring truly requires it.
- Keep new files focused and colocated under the current app hook structure.
- If the work introduces a new log kind, update the matching UI filter defaults,
  persistence shape, and normalization path in the same task.

## Open Decisions Resolved

- Use the existing log window rather than a separate panel.
- Log only intentional commands that change state or invoke an action.
- Exclude passive UI interactions and input noise.

## Recommended Next Step

Create an implementation plan that starts with tests for the shared command
logging helper and the highest-value command entrypoints, then adds the minimal
app-layer wiring needed to feed the existing log window.
