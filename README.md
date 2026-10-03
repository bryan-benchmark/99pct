# 99pct

This repository is the shared source of truth for 99pct. Chat history is not project memory.

99pct is the open-source operating system for people to start Missions, join them, contribute, earn Mission Contribution Units (MCUs), govern what they build, and eventually hold real ownership that survives the website itself.

There is no application code here yet. `bryan-benchmark/missionism` is the private predecessor.

## Operating loop

1. The product owner states the goal or problem.
2. The reviewer updates canonical docs only when the product or architecture actually changes.
3. The reviewer writes one bounded work order.
4. Cursor implements that order on `wo/<number>-<short-name>`.
5. Cursor opens a PR using the repository template and includes tests/evidence.
6. The reviewer audits the actual diff, migrations, tests, and invariant impact.
7. Result: `ACCEPT`, `ACCEPT WITH FOLLOW-UP`, or `REWORK`.
8. Accepted work is squash-merged to `main`; then `CURRENT_STATE.md` and the next work order are updated.

Cursor does not push implementation directly to `main` and does not redefine product philosophy, ownership rules, economic rules, or security boundaries.

## Minimal-context rule

Do not load the whole repository into an agent context by default.

For implementation work, start with:

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. the assigned work order

The work order names any additional canonical files or invariants that must be read. Read other docs only when the task touches them.

## Durable records

- `spec/canonical.json`: normative short claims
- `docs/DECISIONS.md`: accepted/proposed architecture decisions
- `docs/CURRENT_STATE.md`: concise truth about what exists now
- `docs/NEXT.md`: pointer to the next intended work
- `docs/work-orders/`: bounded implementation instructions
- Pull requests: default implementation reports and review evidence
- `docs/implementation-reports/`: reserved for migrations, security audits, releases, or work orders that explicitly require a durable standalone report

See `AGENTS.md` for the coding-agent protocol.
