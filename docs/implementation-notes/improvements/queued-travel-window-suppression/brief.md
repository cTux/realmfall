# Queued Travel Window Suppression

Implemented on `2026-05-02`.

This improvement keeps intermediate queued-travel hexes transit-only for
automatic window behavior, restores normal auto-open behavior on the true final
destination, and clears queued travel on ambush so combat takes over.

Canonical references:

- `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- `docs/specs/reference/gameplay-features/world-exploration/spec.md`
