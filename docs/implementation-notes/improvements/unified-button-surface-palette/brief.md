# Unified Button Surface Palette

This note captures the approved transient design for unifying button-like
control surfaces across `packages/ui` and `packages/client`.

## Goal

Apply one shared visual rule to every interactive button-like control:

- resting controls must render lighter than the window title bar background
  `#0f172a`
- resting borders must sit visually between the title-bar background and the
  control fill
- active, opened, and selected states must use a brighter fill than resting
  controls
- destructive and warning actions keep their red accent family while following
  the same structural state model

## Approved Decisions

- Use the approved `A. Slate Lift` direction for the shared resting surface.
- Put the canonical palette tokens and mixins in
  `packages/client/src/styles/_ui.scss`.
- Keep `packages/ui/src/styles/_ui.scss` as the forwarding entrypoint so the
  shared UI package consumes the same mixins instead of duplicating them.
- Do not preserve transparent or border-only button surfaces for tabs, chips,
  dock buttons, or title-bar controls. These controls should read as filled
  interactive surfaces.
- Keep the close control as a normal `Button` instance with icon content, not a
  dedicated shared close-button component.
- Use the no-circle interpretation of `sbed/cancel` for that close icon: keep
  the inner cancel cross, remove the outer circle, and center the glyph inside
  the compact title-bar button.

## Affected Surfaces

Shared package surfaces:

- `packages/ui/src/components/Button/styles.module.scss`
- `packages/ui/src/components/Window/styles.module.scss`
- `packages/ui/src/components/Tabs/styles.module.scss`
- `packages/ui/src/components/DockPanel/styles.module.scss`

Client package surfaces:

- `packages/client/src/ui/components/DraggableWindow/styles.module.scss`
- `packages/client/src/ui/components/WindowHeaderActionButton.tsx`
- `packages/client/src/ui/components/GameSettingsWindow/styles.module.scss`
- `packages/client/src/ui/components/RecipeBookWindow/styles.module.scss`
- `packages/client/src/ui/components/LogWindow/styles.module.scss`
- any client dock styles that diverge from the shared dock treatment
- window-header action classes that already consume compact header-button
  styling

Out of scope:

- non-button framed panels
- entry rows, cards, and other general containers that are not button-like
  controls

## Implementation Direction

- Add one generic filled-control surface mixin for shared color and state
  treatment.
- Add thin size and usage wrappers for the common variants used in the app:
  default buttons, compact buttons, title-bar buttons, dock buttons, tabs, and
  chip-like controls.
- Migrate shared controls to the new surface mixins first, then move the
  client-only bespoke controls that hardcode their own button colors.
- Keep destructive surfaces on the same structure, but route them through a
  destructive variant instead of the default slate palette.
- Replace any dedicated close-button rendering abstraction with ordinary
  `Button` usage plus the approved centered icon content.

## Verification Direction

- Update shared `packages/ui` jsdom coverage for the affected `Button`,
  `Window`, and related shared control behavior.
- Update client jsdom coverage for title-bar controls and shared window shells
  so compact header-button behavior remains covered.
- Keep the tests structural rather than pixel-snapshot based. Prefer asserting
  state attributes, icon rendering, and control wiring instead of computed color
  values unless one specific regression requires that check.
- Update Storybook coverage where the shared visual contract changes, especially
  for `Button` and any shared window presentation that demonstrates the compact
  icon-only close control.

## Canonical References

- `packages/client/src/styles/_ui.scss`
- `packages/ui/src/styles/_ui.scss`
- `packages/ui/src/components/Button/`
- `packages/ui/src/components/Window/`
- `packages/ui/src/components/Tabs/`
- `packages/ui/src/components/DockPanel/`
- `docs/rules/30-react-ui.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
