# Work orders

A work order is the only instruction that authorizes a product change.

Each order states the goal, the user outcome, non-goals, the security invariants that apply, and the acceptance checks. Agents read `VISION.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `SECURITY_INVARIANTS.md`, `CURRENT_STATE.md`, relevant decisions, and the order before editing. If the order contradicts an accepted decision, stop and add a proposed ADR.

When the order is finished, add `docs/implementation-reports/WO-####-*.md` and update `CURRENT_STATE.md`. Do not start the next order in the same change.

## Report shape

```text
IMPLEMENTATION REPORT WO-####

Commit:
Changed:
Acceptance criteria:
Tests:
Security:
Migration:
Deviations:
Known issues:
Canonical docs updated:
Manual verification:
```
