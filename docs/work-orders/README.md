# Work orders

A work order is the durable input to one implementation PR.

Use one branch: `wo/<number>-<short-name>`.

The work order must be short enough to reread cheaply and complete enough that Cursor does not need chat history.

Agents read `AGENTS.md`, `CURRENT_STATE.md`, and the assigned work order first. The work order explicitly names any additional docs required.

The PR is the default implementation report. Standalone implementation reports are only required when the work order says so.

See `TEMPLATE.md`.
