# Specs

`docs/specs` stores the project's canonical shipped-reference specifications.

Reference indexes:

- [Gameplay Features](./reference/gameplay-features/README.md)
- [Technical Solutions](./reference/technical-solutions/README.md)

Supporting planning notes:

- [Implementation Notes](../implementation-notes/README.md)

Workflow expectations:

- Every implemented feature should create or update the matching canonical spec.
- Every change to an existing feature should keep its canonical spec in sync in
  the same task.
- Each gameplay feature and each technical solution should have its own
  dedicated reference spec file.
- Keep transient plans, research, checklists, and quickstarts outside
  `docs/specs`.
- Keep `spec` naming reserved for canonical files under `docs/specs`; use
  transient names such as `brief.md` under `docs/implementation-notes`.
- Use index documents as navigation only.
