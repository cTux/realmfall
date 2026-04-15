# PROMPTS

## Git

```
Create a branch from local default branch for the updates in this prompt.
```

## Shared Rules

```
* Load and apply the relevant sections from "docs/RULES.md" before acting.
* Treat those relevant rules as default context for the prompt.
* If a prompt contains "add rule", update "docs/RULES.md" first and sync the related markdown entrypoints only when workflow or prompt behavior changed.
* Favor DRY refactors, maximally reusable components, and shared helpers over duplicated implementations.
* In JavaScript and TypeScript, prefer concise arrow functions when a function immediately returns an expression.
* When a JavaScript or TypeScript syntax preference can be enforced mechanically, prefer adding or adjusting the corresponding ESLint rule.
* Keep Storybook stories in sync with UI component and entity dictionary changes when the prompt touches those areas.
* Keep this file compact. Prefer referencing "docs/RULES.md" instead of repeating long project rule lists here.
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
* Keep "docs/RULES.md" as the canonical source and keep the other markdown entrypoints compact.
```

## Commit

```
* Commit all the existing changes.
* Automatically generate commit messages based on the changes.
* Commit messages should respect Conventional Commits rules.
* If there are some changes in TODO.md, PROMPTS.md, RULES.md or RESTRICTIONS.md just ignore them inside commit message.
```

## TODOs

```
* Go inside "docs/TODO.md" and get any feature / improvement / issue to do.
* Write spec and plan markdown files (under docs/specs/{type}s/{todo-name}/*.md) using [GitHub Spec Kit CLI](https://github.github.com/spec-kit/).
* When the task changes an existing feature, update the relevant existing spec too.
* Keep one implemented gameplay feature or one technical solution per spec file. Use index markdown files only for navigation.
* If it's related to something visual then also add (generate) images and link them in the .md files.
* Remove that feature / improvement / issue from the list.
```
