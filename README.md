# 99pct

This repository is the shared control plane for 99pct. Humans and coding agents read the same files. Chat history is not project memory.

99pct is the open-source operating system for building things together: start a Mission, join one, record contribution, earn Mission Contribution Units, and eventually hold real ownership that does not depend on this website staying up.

There is no application code here yet. The running site is still `bryan-benchmark/missionism`.

## How to work

1. A human says what they want.
2. The reviewer reconciles it with the docs below and, when the design changes, updates those docs first.
3. The reviewer writes one bounded work order in `docs/work-orders/`.
4. The coding agent reads the canonical docs and that work order, implements only that order, and commits.
5. The reviewer audits the commit, diff, and tests. The result is `ACCEPT`, `ACCEPT WITH FOLLOW-UP`, or `REWORK`.
6. The next work order starts only after that.

The coding agent does not redefine product philosophy, ownership rules, economic rules, or security boundaries. If an order conflicts with an accepted decision, the agent stops and adds a proposed ADR. It does not silently change the design.

## What to read first

| File | Role |
|---|---|
| [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) | What exists today |
| [`docs/NEXT.md`](docs/NEXT.md) | The next slices, not a license to build them all |
| [`docs/VISION.md`](docs/VISION.md) | Why 99pct exists |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | What the product does |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Ledger and system boundaries |
| [`docs/SECURITY_INVARIANTS.md`](docs/SECURITY_INVARIANTS.md) | Rules an implementation may not weaken |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Target objects and the predecessor schema |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Accepted and proposed decisions |
| [`spec/canonical.json`](spec/canonical.json) | Normative short claims |

Work orders live in [`docs/work-orders/`](docs/work-orders/). Implementation reports live in [`docs/implementation-reports/`](docs/implementation-reports/).

## Layout

```text
README.md
spec/canonical.json
docs/VISION.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/SECURITY_INVARIANTS.md
docs/DATA_MODEL.md
docs/DECISIONS.md
docs/CURRENT_STATE.md
docs/NEXT.md
docs/work-orders/
docs/implementation-reports/
```
