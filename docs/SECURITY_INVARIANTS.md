# Security invariants

Updated: 2026-10-03

These rules bind implementation. Do not weaken them without an accepted Architecture Decision Record in `DECISIONS.md`.

They are not yet enforced by tests in this repository. The predecessor application enforces a narrower, related set: workspace history tables reject updates and deletes in PostgreSQL, workspace actions check membership on the server, and the Mission Units engine refuses a manual ownership-percentage path. That is not compliance with this document.

## Application invariants

### SEC-001

No ordinary password or session credential alone may transfer legal ownership.

### SEC-002

MCU history is append-only. Corrections occur through new compensating events rather than destructive history edits.

### SEC-003

Deleting or disabling a 99pct account cannot itself destroy legally issued ownership.

### SEC-004

Raw Social Security numbers must not be stored in the normal 99pct application database.

### SEC-005

No application administrator may have an unrestricted "set ownership percentage" capability.

### SEC-006

Every MCU event must ultimately be attributable to a Mission, contributor, governing rule and version, evidence or reason, timestamp, and the actor or process that authorized it.

### SEC-007

The UI may describe legal equity as issued only when an authoritative legal issuance or reference exists.

### SEC-008

The UI must not imply that MCUs are freely transferable securities.

### SEC-009

Mission contribution records must eventually be exportable and independently verifiable.

### SEC-010

Authorization for protected actions must be enforced server-side, not only through UI visibility.

## Ownership safety invariants

These are the design standard behind SEC-001 through SEC-010. Implementation still has to satisfy the SEC rules above.

| ID | Rule | Related SEC rules |
|---|---|---|
| OWN-001 | Ownership is a registered legal relation, not a bearer token. | SEC-001, SEC-008 |
| OWN-002 | No seed phrase controls a person's equity. | SEC-001 |
| OWN-003 | No single credential can transfer ownership. | SEC-001 |
| OWN-004 | No single administrator can alter ownership. | SEC-005 |
| OWN-005 | Nothing is silently deleted. Corrections are new events. | SEC-002 |
| OWN-006 | MCU history is cryptographically tamper-evident. | SEC-009 |
| OWN-007 | Actual ownership exists independently of 99pct. | SEC-003, SEC-007 |
| OWN-008 | Money is held by regulated financial infrastructure, not the application database. | SEC-004 |
| OWN-009 | Private identity information never goes on a public ledger. | SEC-004 |
| OWN-010 | Every Mission can export and independently verify its complete history. | SEC-009 |
| OWN-011 | Vested contributor ownership cannot be confiscated merely for leaving the Mission. | SEC-003 |
| OWN-012 | If 99pct disappears, the humans still own their companies. | SEC-003, SEC-007 |

OWN-011 is a requirement for corporate documents and equity agreements, not a feature flag in application terms of service.

## Test expectation for later work orders

Security-sensitive work orders include negative tests. An authorized person can perform the action, and an unauthorized person receives a server-side refusal. UI hiding is not the test.
