# Quickstart: Remove Ineffective World Import Split

## Verify the fix

1. Run `pnpm build` from the repository root.
2. Confirm the build completes without Vite warnings about ineffective dynamic imports from `src/app/App/usePixiWorld.ts`.
3. Confirm a separate `renderScene-*.js` chunk is still emitted, showing the real world-render lazy boundary remains intact.

## Implementation note

The fix should only convert imports that are already eager elsewhere on the main app path. Do not collapse the full world-render path into the initial bundle unless a separate bundle-strategy change is requested.
