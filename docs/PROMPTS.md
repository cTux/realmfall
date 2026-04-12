# PROMPTS

## Shared Rules

```
* Before acting on a prompt, load and apply the relevant sections from "docs/RULES.md" automatically.
* Apply only the rules that are relevant to the prompt's context.
* If a prompt contains "add rule", update "docs/RULES.md" immediately in the corresponding section and keep related docs in sync.
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
