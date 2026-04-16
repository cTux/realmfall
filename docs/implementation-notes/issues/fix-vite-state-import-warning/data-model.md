# Data Model: Remove Ineffective World Import Split

## Entities

### Initial Path Module

- **Description**: A module that is already loaded as part of normal application bootstrap.
- **Relevant attributes**:
  - `modulePath`: repository path of the module
  - `alreadyEager`: whether another main-path import already loads it
  - `worldHookUsage`: whether `usePixiWorld` also depends on it
- **Validation rules**:
  - Modules marked `alreadyEager` should not be treated as meaningful lazy split points inside the same app path.

### World Lazy Boundary

- **Description**: The remaining deferred world-render entry that is intentionally loaded after the initial app path.
- **Relevant attributes**:
  - `entryModule`: lazy entry module path
  - `supportsWorldBootstrap`: whether it is needed only when the Pixi world initializes
  - `stillDeferred`: whether build output keeps it outside the main entry chunk
- **Validation rules**:
  - The lazy boundary should remain only for modules not already eager on the main path.

### Build Verification Result

- **Description**: Captures whether the production build confirms the bundle intent.
- **Relevant attributes**:
  - `command`: verification command used
  - `warningPresent`: whether the ineffective dynamic-import warning still appears
  - `buildSucceeded`: whether production output completed successfully
- **Validation rules**:
  - A successful result requires `buildSucceeded = true` and `warningPresent = false`.
