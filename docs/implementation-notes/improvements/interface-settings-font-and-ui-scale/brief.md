# Interface Settings Font And UI Scale

Historical note for the shipped `fontSize` and `interfaceScale` interface
settings work.

The final implementation keeps `fontSize` text-only, keeps `interfaceScale`
off the Pixi canvas path, and preserves fixed UI anchors and map input after
the follow-up regression fixes.

Canonical behavior now lives in:

- `docs/specs/reference/gameplay-features/game-settings/spec.md`
