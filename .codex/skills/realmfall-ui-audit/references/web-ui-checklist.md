# Web UI Checklist

Use this checklist as a secondary audit pass after applying Realmfall's scoped rules.

## Accessibility

- Icon-only controls need a clear accessible name.
- Inputs need an associated label or explicit accessible name.
- Clickable controls should use semantic elements such as `button` or links where appropriate.
- Decorative graphics should be hidden from assistive tech.
- Async validation or status changes should expose a polite live region when users need the update announced.

## Focus and Keyboard Interaction

- Interactive controls need a visible focus state.
- Do not remove browser outlines unless a clear replacement exists.
- Compound controls can use `:focus-within` to expose group focus.
- Keyboard interaction should match the control type and should not depend on pointer-only affordances.

## Forms and Validation

- Use the right input type and `inputMode` where it improves data entry.
- Do not block paste for normal inputs.
- Keep validation errors near the field and make the recovery path obvious.
- Disable spellcheck on inputs where autocorrection creates noise, such as codes or email addresses.

## Motion and Animation

- Honor reduced-motion preferences for nonessential animation.
- Prefer `transform` and `opacity` for animation work.
- Avoid `transition: all`; list the properties explicitly.
- Animated UI should remain interruptible when the user changes direction mid-flow.

## Copy and Content Handling

- Use the ellipsis character in loading or continuation copy.
- Ensure narrow layouts and long strings can wrap, clamp, or truncate without breaking the window layout.
- Empty states should be deliberate rather than rendering broken chrome or blank data containers.
- Error copy should tell the user what to do next.

## Layout and Touch

- Avoid accidental horizontal overflow.
- Prefer CSS layout primitives over JS measurements when possible.
- Touch targets and drag affordances should behave predictably on pointer and touch devices.
- Prevent unwanted text selection or scroll chaining when a drag or modal interaction owns the gesture.

## Performance and Hydration

- Avoid layout reads in render paths.
- Large mapped collections should have a strategy for keeping rerenders cheap.
- Controlled inputs should stay lightweight per keystroke.
- Inputs with `value` need `onChange`, or they should use uncontrolled props instead.

## Locale and Formatting

- Dates, times, numbers, and currency should flow through `Intl` formatting.
- User-facing copy belongs in i18n resources rather than inline literals.
- Avoid hardcoded English fragments in tooltip or formatter helpers when a localized formatter fits.

## Realmfall-Specific Overrides

- Prefer the repo's desktop-style window model over generic page-navigation advice.
- Prefer the shared custom tooltip system over native `title` tooltips on existing tooltip-driven controls.
- Shared client buttons should route through `Button` from `@realmfall/ui-react`.
- Treat Storybook coverage as part of the review surface for shared components and client-only windows when behavior changes.
