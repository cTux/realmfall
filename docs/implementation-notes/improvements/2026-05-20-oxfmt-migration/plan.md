# Oxfmt Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully replace Prettier with Oxfmt across the Realmfall repository without weakening staged quality checks, contributor workflow, or current formatting expectations.

**Architecture:** The migration keeps formatter ownership at the repository root. Oxfmt becomes the single formatting tool, the staged quality runner calls it directly from the root instead of through `@realmfall/client-web`, and the migration lands in two clean commits: tooling and docs first, then the repository-wide format rewrite. The plan keeps package key ordering and import ordering unchanged unless the repository explicitly opts into those behaviors later.

**Tech Stack:** pnpm workspace, Oxfmt, Oxlint, Stylelint, Husky, Node scripts, Vitest, Markdown docs

---

## Scope Check

- In scope: root formatter config, package manifests, staged quality scripts, script tests, repo docs, rule docs, technical-solution spec, and one repo-wide formatting pass.
- Out of scope: enabling Oxfmt import sorting, package.json sorting, Tailwind sorting, CI formatter gates, or unrelated lint rule changes.

## File Structure

### Tooling and config

- Create: `.oxfmtrc.jsonc`
  - Root Oxfmt configuration pinned to the current repo style and migration-safe defaults.
- Modify: `package.json`
  - Add root Oxfmt scripts and root dev dependency.
- Modify: `packages/client-web/package.json`
  - Remove direct Prettier dependency now that formatting lives at the root.
- Delete: `prettier.config.cjs`
  - Remove obsolete Prettier config after Oxfmt config is in place.
- Modify: `pnpm-lock.yaml`
  - Refresh lockfile after dependency changes.

### Staged quality path

- Modify: `scripts/run-staged-quality.helpers.mjs`
  - Rename formatter helpers to neutral Oxfmt-safe names and keep the extension allowlist explicit.
- Modify: `scripts/run-staged-quality.mjs`
  - Swap staged formatter execution from `prettier --write` to root `oxfmt`.
- Modify: `scripts/tests/run-staged-quality.test.ts`
  - Update command expectations from Prettier to Oxfmt while preserving batching assertions.

### Docs and canonical references

- Modify: `README.md`
  - Replace stack and command references from Prettier to Oxfmt.
- Modify: `docs/rules/00-general.md`
  - Replace formatting-policy references from Prettier to Oxfmt.
- Modify: `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`
  - Update the current-system tooling description to match the shipped Oxfmt workflow.

## Task 1: Install And Configure Oxfmt At The Repository Root

**Files:**

- Create: `.oxfmtrc.jsonc`
- Modify: `package.json`
- Modify: `packages/client-web/package.json`
- Delete: `prettier.config.cjs`

- [ ] **Step 1: Add the root Oxfmt configuration**

```jsonc
// .oxfmtrc.jsonc
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 80,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "sortImports": false,
  "sortPackageJson": false,
  "overrides": [
    {
      "files": ["*.md"],
      "options": {
        "proseWrap": "preserve",
      },
    },
  ],
}
```

- [ ] **Step 2: Add root Oxfmt dependency and formatter scripts**

```json
// package.json
{
  "scripts": {
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check ."
  },
  "devDependencies": {
    "oxfmt": "^0.18.0"
  }
}
```

```json
// packages/client-web/package.json
{
  "devDependencies": {
    "prettier": null
  }
}
```

Implementation note: remove the `prettier` entry entirely from `packages/client-web/package.json`; do not leave `null` in the file. No other package currently owns a direct Prettier dependency.

- [ ] **Step 3: Remove the obsolete Prettier config**

Delete `prettier.config.cjs` entirely once `.oxfmtrc.jsonc` exists.

- [ ] **Step 4: Install dependencies and verify the formatter CLI exists**

Run: `pnpm install`

Expected: install completes, `pnpm oxfmt --version` prints a version, and no script still depends on a direct local `prettier` binary.

- [ ] **Step 5: Dry-run Oxfmt against the repo before editing hook logic**

Run: `pnpm fmt:check`

Expected: FAIL with a non-zero exit because existing files have not been rewritten yet, but the command should parse the config and scan files without config errors.

- [ ] **Step 6: Commit the root formatter adoption**

```bash
git add .oxfmtrc.jsonc package.json packages/client-web/package.json pnpm-lock.yaml
git rm prettier.config.cjs
git commit -m "chore: adopt oxfmt config"
```

## Task 2: Replace The Staged Formatter Path

**Files:**

- Modify: `scripts/run-staged-quality.helpers.mjs`
- Modify: `scripts/run-staged-quality.mjs`

- [ ] **Step 1: Rename the formatter extension helper to neutral naming**

```js
// scripts/run-staged-quality.helpers.mjs
const FORMAT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.json',
  '.md',
  '.html',
  '.yaml',
  '.yml',
]);

export function isFormatFile(file) {
  return FORMAT_EXTENSIONS.has(getExtension(file));
}
```

Implementation note: remove the old `PRETTIER_EXTENSIONS` constant and `isPrettierFile` export instead of keeping aliases.

- [ ] **Step 2: Swap the staged formatter command from Prettier to Oxfmt**

```js
// scripts/run-staged-quality.mjs
import {
  chunkFilesByArgumentLength,
  isFormatFile,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
  shouldRunFullTestSuite,
} from './run-staged-quality.helpers.mjs';

const formatFiles = stagedFiles.filter(isFormatFile);

if (formatFiles.length > 0) {
  runChunkedCommand(
    `Running Oxfmt on ${formatFiles.length} staged file(s)`,
    ['exec', 'oxfmt', '--config', resolve('.oxfmtrc.jsonc')],
    toAbsolutePaths(formatFiles),
  );
} else {
  logStep('Skipping staged Oxfmt, no matching files');
}
```

Implementation notes:

- Keep `runChunkedCommand`, absolute-path batching, and the rest of the staged flow unchanged.
- Remove the `--filter @realmfall/client-web` prefix from formatter execution because the formatter now lives at the repository root.
- Keep Oxlint and Stylelint invocation behavior unchanged in this task.

- [ ] **Step 3: Run the staged helper directly against a small sample change**

Run:

```bash
git add README.md
pnpm auto:pre:commit
git reset README.md
```

Expected: the staged quality script logs `Running Oxfmt` or `Skipping staged Oxfmt`, never mentions Prettier, and does not fail from a missing formatter binary.

- [ ] **Step 4: Commit the hook migration**

```bash
git add scripts/run-staged-quality.helpers.mjs scripts/run-staged-quality.mjs
git commit -m "chore: route staged formatting through oxfmt"
```

## Task 3: Update Script Tests And Repo Documentation

**Files:**

- Modify: `scripts/tests/run-staged-quality.test.ts`
- Modify: `README.md`
- Modify: `docs/rules/00-general.md`
- Modify: `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`

- [ ] **Step 1: Update the staged-quality script test expectations**

```ts
// scripts/tests/run-staged-quality.test.ts
const fixedArgs = ['exec', 'oxfmt', '--config', resolve('.oxfmtrc.jsonc')];
```

Implementation note: update any log-text assertions from `Prettier` to `Oxfmt`, and keep the test coverage for argument chunking, staged-file filtering, and no-op paths intact.

- [ ] **Step 2: Update the README stack and command references**

```md
<!-- README.md -->

- Oxfmt

## Common Commands

- `pnpm dev`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm fmt`
- `pnpm fmt:check`
- `pnpm test`
- `pnpm build`
```

- [ ] **Step 3: Update the general rules to make Oxfmt canonical**

```md
<!-- docs/rules/00-general.md -->

- Keep TypeScript strictness, Oxlint, Oxfmt, tests, and Husky hooks working. New changes should not weaken existing quality gates.
- Keep the pre-commit hook aligned with the formatting workflow as well. Staged files that Oxfmt supports should be formatted during pre-commit so repository-wide formatting drift does not accumulate outside the enforced path.
- When a requested JavaScript or TypeScript syntax preference also depends on formatting behavior, update the relevant Oxfmt configuration when that style can be enforced there as well.
```

- [ ] **Step 4: Update the quality-tooling spec to reflect shipped behavior**

```md
<!-- docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md -->

- The repository uses TypeScript strict mode, Oxlint, Stylelint, Oxfmt, Vitest, Husky, Vite, and Storybook.
- `scripts/run-staged-quality.mjs` batches staged Oxfmt, Oxlint, Stylelint, and `vitest related` file lists into argument-length-safe chunks so Windows commit hooks can validate large staged refactors without hitting process launch limits.
- `.oxfmtrc.jsonc`
```

Implementation note: remove the `prettier.config.cjs` reference from the implementation-area list and add `.oxfmtrc.jsonc` instead.

- [ ] **Step 5: Verify no prompt-visible docs still claim Prettier is canonical**

Run: `rg -n -e Prettier -e prettier -e prettier.config.cjs README.md docs scripts packages`

Expected: only acceptable hits are third-party lockfile data, migration notes, or intentional historical references. Current workflow docs and active scripts should not describe Prettier as the repo formatter anymore.

- [ ] **Step 6: Commit the tests and docs alignment**

```bash
git add scripts/tests/run-staged-quality.test.ts README.md docs/rules/00-general.md docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md
git commit -m "docs: align formatting workflow with oxfmt"
```

## Task 4: Run The Repository-Wide Oxfmt Rewrite And Verify The Toolchain

**Files:**

- Modify: repository files touched by `pnpm fmt`
- Modify: `pnpm-lock.yaml` only if a final install refresh changes it further

- [ ] **Step 1: Run the repository-wide formatter**

Run: `pnpm fmt`

Expected: Oxfmt rewrites supported files in place using the root config and finishes without parser or config errors.

- [ ] **Step 2: Review the diff by risky surface before validation**

Run:

```bash
git diff --stat
git diff -- package.json packages/client-web/package.json README.md docs/rules/00-general.md
```

Expected: formatting-only changes, no unexpected `package.json` key reordering, and no content regressions in Markdown headings or code fences.

- [ ] **Step 3: Run the shared verification path**

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected: all commands pass. If a command fails because Oxfmt rewrote syntax in a way that conflicts with existing snapshots or brittle assertions, fix the narrow test or config mismatch before continuing.

- [ ] **Step 4: Prove the pre-commit path re-stages formatted files correctly**

Run:

```bash
git add .
pnpm auto:pre:commit
git diff --cached --name-only
```

Expected: the staged diff remains staged after formatting, the script does not mention Prettier, and no missing-binary or missing-config errors occur.

- [ ] **Step 5: Do the final Prettier dead-reference scan**

Run: `rg -n -e Prettier -e prettier -e prettier.config.cjs . -g '!pnpm-lock.yaml' -g '!node_modules/**'`

Expected: zero active workflow references outside intentional historical notes. If any active script, README, rule, or package manifest still mentions Prettier, fix it before the final commit.

- [ ] **Step 6: Commit the repository-wide formatting rewrite**

```bash
git add .
git commit -m "style: rewrite repository with oxfmt"
```

## Self-Review

- Spec coverage: this plan covers root formatter installation, staged hook migration, test updates, docs and rule updates, and the final repository-wide rewrite plus validation.
- Placeholder scan: no `TBD`, `TODO`, or open-ended “write tests later” steps remain.
- Type consistency: file paths, helper names, and command names stay consistent across tasks. The formatter helper is renamed to `isFormatFile` everywhere it is referenced.

## Execution Handoff

Plan complete and saved to `docs/implementation-notes/improvements/2026-05-20-oxfmt-migration/plan.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh worker per task, review between tasks.
2. Inline Execution - execute tasks in this session in order.

Say `execute plan` if me should start implementation.
