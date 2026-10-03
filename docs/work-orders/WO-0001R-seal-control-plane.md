# WO-0001R — Seal the control plane

## Goal

Repair the foundation before application code lands and optimize the human/reviewer/Cursor loop for low duplication and high auditability.

## In scope

- Materialize durable work-order/report paths.
- Make 99pct the intended future application repo after sanitized migration.
- Prevent blind publication of the private predecessor's Git history.
- Add minimal-context agent instructions.
- Make PRs the default implementation report.
- Add branch discipline for Cursor.
- Correct global-participation wording.
- Add an explicit non-custodial money invariant.
- Record licensing as an unresolved decision.
- Create WO-0002 migration preflight.

## Out of scope

- Application code
- Migrating Missionism
- Selecting a final license
- Product features
- Editing canonical claim text

## Verification

- `spec/canonical.json` claim text unchanged.
- No application source code added.
- No secrets or credentials added.
- All new control-plane paths are tracked.

## Return

This repair is performed by the reviewer through a PR and squash merge.
