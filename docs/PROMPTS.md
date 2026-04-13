# PROMPTS

## Git

```
Create a branch from local default branch for the updates in this prompt.
```

## Shared Rules

```
* Before acting on a prompt, load and apply the relevant sections from "docs/RULES.md" automatically.
* Apply only the rules that are relevant to the prompt's context.
* Treat the relevant rules as part of the default context for future prompts, even when the prompt does not restate them.
* If a prompt contains "add rule", update "docs/RULES.md" immediately in the corresponding section and keep related docs in sync.
* If a rule changes prompt workflow or contributor expectations, also update "README.md", this file, and the AI-specific instruction files.
* Use "docs/PROJECT_REVIEW.md" and this file as inputs for recurring guidance, but keep "docs/RULES.md" as the canonical rules source.
* When a task adds or changes user-facing text, update the i18n resources instead of hardcoding the copy and follow the `{feature}.{area}.{property}` key pattern.
* For label formatters that map stable identifiers such as status effects to i18n, prefer direct patterned key lookups over conditional branches when the key can be derived safely.
* For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape. Prefer transparent exports or remove background paths before committing so icons do not render as solid squares.
* For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently.
```

## Review

```
* Review this project for all the known possible best practices and approaches based on used tech stack.
    * Do not forget about browser performance review (including React.js re-renders)
    * Do not forget about pixi.js performance review
* Write / update "docs/PROJECT_REVIEW.md" about "Pros", "Cons" and "Improvements" at the root of the project.
* Improvements should be split by priorities.
* Do not write "Scope", "Stack Observed", "Summary" or "Overall Assessment".
```

## Rules

```
* Write (update) rules for this project based on the best practices and approaches used in this project.
* Some useful information like "Pros" can be found in "docs/PROJECT_REVIEW.md".
* Some useful information can be found in "docs/PROMPTS.md". It contains common prompts which are used regularly.
* These rules should be automatically added to the future prompts if they are relevant to the prompt's context.
* Update README.md to describe all the current project's state and rules.
* If any prompt contains "add rule" statement it should be immediately added to the corresponding rule.
* If rule changes affect future prompt execution, also update the shared prompt instructions in this file.
* Also adjust AI-specific files.
* Keep "docs/RULES.md" as the canonical source and sync the shared workflow expectations into README and AI entrypoints instead of duplicating divergent project rules.
* For Pixi world performance work, prefer one render scheduler, usually the ticker, and use refs or lightweight invalidation flags instead of layering an immediate redraw effect on top.
* When adding a new draggable window, keep its content bundle-split by following the existing lazy window or lazy `*WindowContent` pattern.
* If a prompt needs new world content, names, factions, places, enemies, items, structures, or flavor text, align it with `docs/lore/REALMFALL.md`.
* Keep each unique item, enemy, and structure in its own dedicated configuration file instead of adding more entries to one catch-all content-definition module.
* Keep user-facing text in i18n resources, default to `en`, add new keys instead of inline strings, and use dot-separated keys like `{feature}.{area}.{property}`.
* For label formatters that map stable identifiers such as status effects to i18n, prefer direct patterned key lookups over conditional branches when the key can be derived safely.
* For ability, buff, and debuff icons rendered through CSS masks, use transparent SVG assets with no full-canvas background shape. Prefer transparent exports or remove background paths before committing so icons do not render as solid squares.
* For UI elements that already use the custom game tooltip system, do not add native browser `title` tooltips. Buffs, debuffs, abilities, and similar interactive affordances should use the shared custom tooltip consistently.
```

## Commit

```
* Commit all the existing changes.
* Automatically generate commit messages based on the changes.
* Commit messages should respect Conventional Commits rules.
* If there are some changes in FEATURES.md, IMPROVEMENTS.md, ISSUES.md, PROMPTS.md, RULES.md or RESTRICTIONS.md just ignore them inside commit message.
```

## TODOs

```
* Go inside "docs/TODO.md" and get any feature / improvement / issue to do.
* Write spec and plan markdown files (under docs/specs/{type}s/{todo-name}/*.md) using [GitHub Spec Kit CLI](https://github.github.com/spec-kit/).
* If it's related to something visual then also add (generate) images and link them in the .md files.
* Remove that feature / improvement / issue from the list.
```
