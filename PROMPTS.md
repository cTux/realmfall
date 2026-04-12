# PROMPTS

## Review

```
* Review this project for all the known possible best practices and approaches based on used tech stack.
    * Do not forget about browser performance review (including React.js re-renders)
    * Do not forget about pixi.js performance review
* Write "PROJECT_REVIEW.md" about "Pros", "Cons" and "Improvements" at the root of the project.
* Improvements should be split by priorities.
* Do not write "Scope", "Stack Observed", "Summary" or "Overall Assessment".
```

## Rules

```
* Write (update) rules for this project based on the best practices and approaches used in this project.
* Some useful information like "Pros" can be found in "PROJECT_REVIEW.md".
* These rules should be automatically added to the future prompts if they are relevant to the prompt's context.
* Update README.md to describe all the current project's state and rules.
* If any prompt contains "add rule" statement it should be immediately added to the corresponsing rule.
```

## Commit

```
* Commit all the existing changes.
* Automatically generate commit messages based on the changes.
* Commit messages should respect Conventional Commits rules.
```
