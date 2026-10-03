# 99pct agent protocol

Use the smallest context needed.

## Always read

1. `docs/CURRENT_STATE.md`
2. the assigned file in `docs/work-orders/`

The work order will name any additional required docs.

## Rules

- Implement only the assigned work order.
- Do not silently change accepted ADRs, product philosophy, ownership semantics, economic rules, or security boundaries.
- If the work conflicts with an accepted decision, stop that portion and flag the conflict in the PR.
- Reuse the existing stack unless the work order explicitly authorizes a change.
- Protected actions require server-side authorization.
- Never introduce raw SSNs, custodial cash balances, manual ownership-percentage authority, or bearer-token ownership.
- Do not describe MCUs as issued legal equity.
- Run the verification required by the work order.
- Use branch `wo/<number>-<short-name>`.
- Open a PR; do not push implementation directly to `main`.
- The PR body is the default implementation report.

Do not read every design document unless the work order asks you to. This is intentional.
