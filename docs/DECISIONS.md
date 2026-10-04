# Decisions

Accepted records are binding. Proposed records are not implemented until accepted.

## ADR-001 — MCUs are contribution units, not bearer securities

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

MCUs represent recognized contribution. They are not assumed to be transferable legal securities. Legal shares or other instruments are a separate ledger, created only when a Mission's legal process issues them.

Implication: SEC-007 and SEC-008 apply.

## ADR-002 — Three ledgers; 99pct is not the ownership authority

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Contribution/MCUs, legal equity, and money are separate ledgers. 99pct may orchestrate them but is not the sole authority for legal ownership or money.

## ADR-003 — Preserve the predecessor stack during foundation work

Status: Accepted  
Date: 2026-10-03  
Source: WO-0001

Do not rewrite the existing Next.js, Firebase, Firebase Auth, and PostgreSQL architecture merely to begin 99pct.

## ADR-004 — This repository is the control plane

Status: Accepted  
Date: 2026-10-03

`bryan-benchmark/99pct` is the shared source of truth for product, architecture, work orders, review state, and canonical short claims. Chat transcripts are not project memory.

## ADR-005 — Reconcile older MCU wording with ADR-001

Status: Proposed  
Date: 2026-10-03

Older Missionism material sometimes describes an MCU as both a contribution credit and an ownership claim. A later documentation order should reconcile that wording without changing the append-only contribution model or creating a global MCU market.

## ADR-006 — 99pct becomes the application repository after sanitized migration

Status: Accepted  
Date: 2026-10-03

`bryan-benchmark/missionism` is a private predecessor. Do not publish or merge its full Git history into this public repository without a dedicated secret/privacy/history audit.

First perform migration preflight. Then import a sanitized current application snapshot, preserving useful architecture without blindly publishing private history. Keep the existing stack unless a later accepted ADR changes it.

After migration, new 99pct product development occurs here. The Missionism repository becomes predecessor/archive rather than a second active product source.

## ADR-007 — Application source uses AGPL-3.0-only

Status: Accepted  
Date: 2026-10-03

99pct application source code is licensed under the GNU Affero General Public License version 3 only (`AGPL-3.0-only`), unless a file explicitly states otherwise.

Why this license:

- 99pct is intended to be genuinely open and forkable.
- A network-hosted fork that modifies the AGPL-covered application must offer its users the corresponding source for that modified version.
- `-only` is deliberate: a future license version does not silently change the project's terms.

Scope:

- application source, application tests, build/runtime scripts, and application configuration imported into this repository are AGPL-3.0-only unless explicitly noted;
- third-party dependencies retain their own licenses;
- `docs/` and `spec/` are not granted an AGPL license merely because they share this repository. Their long-term documentation/protocol license is a separate future decision;
- trademarks, Mission certification/compatibility rules, funding restrictions, contributor-ownership requirements, and governance rules are not created by the software license.

Before a 99pct-hosted AGPL application is publicly deployed, its interface must provide users a clear path to the corresponding source as required for network interaction.

## ADR-008 — Pull requests are the default implementation report

Status: Accepted  
Date: 2026-10-03

Each Cursor work order uses one `wo/<number>-<short-name>` branch and one PR. The standardized PR body records acceptance criteria, tests, migrations, invariant impact, deviations, and risks.

Standalone files in `docs/implementation-reports/` are reserved for migrations, security audits, releases, or work orders that explicitly require them.

Reason: avoid duplicating the same implementation narrative in chat, a report file, and a PR.

## ADR-009 — Minimal-context agent protocol

Status: Accepted  
Date: 2026-10-03

Agents read `AGENTS.md`, `CURRENT_STATE.md`, and the assigned work order by default. The work order explicitly names any additional architecture/security/product context required.

Reason: canonical docs remain durable without paying the token cost of loading all of them on every implementation turn.

## ADR-010 — Dependency-security exceptions are explicit and expiring

Status: Accepted  
Date: 2026-10-04

A red dependency audit may not be solved by deleting the audit gate, broadly ignoring severity, or running a breaking automatic fix without review.

If a current advisory cannot safely be removed immediately, a temporary exception is allowed only when it is:

- advisory-specific and package-specific;
- tied to the exact dependency path/version being accepted;
- classified as runtime, build-time, development-only, or unreachable;
- supported by evidence explaining why the vulnerable code path is not exposed or why no patched version exists;
- bounded by an expiration/review date no more than 30 days away;
- enforced mechanically so any new or changed moderate-or-higher advisory still fails CI.

Prefer remediation over exception. Exceptions are debt with an owner and expiry, not a green-check workaround.

## ADR-011 — First 99pct deployment is isolated and manually promoted

Status: Accepted  
Date: 2026-10-04

The first 99pct network deployment must not reuse or retarget the predecessor Missionism Firebase project/backend.

Create or select a separate Firebase project dedicated to 99pct and connect its App Hosting backend to `bryan-benchmark/99pct`.

Until the baseline and domain-cutover work orders are accepted:

- use Firebase's generated App Hosting domain, not `99pct.com`;
- keep automatic rollouts disabled;
- promote a specific reviewed Git commit manually;
- keep the predecessor deployment untouched as an independent reference/rollback system;
- do not configure a shared production database merely to make the public explanatory site deploy;
- workspace functionality may remain fail-closed until its own environment is deliberately provisioned.

Before the first network rollout, the public UI must provide a clear link to the corresponding AGPL source repository.

Reason: separate infrastructure and commit-specific manual promotion minimize accidental production coupling while 99pct is establishing its own release boundary.

## ADR-012 — 99pct.com is canonical; domain cutover preserves non-web DNS

Status: Accepted  
Date: 2026-10-04

The canonical public application host is:

`https://99pct.com`

`www.99pct.com` redirects to the apex.

The custom-domain cutover uses Firebase App Hosting's domain migration/preparation flow before web-routing records move.

Domain ownership and DNS are separate concerns. A registrar transfer, nameserver transfer, or DNS-provider migration is not required merely to connect the web application.

Before changing DNS:

- determine the authoritative nameservers and actual DNS provider from live DNS, not from assumptions about the registrar UI;
- snapshot the existing apex/www web records plus NS, MX, TXT, and CAA records;
- preserve email, verification, DKIM/SPF/DMARC, and other unrelated DNS records;
- use the exact verification/routing records Firebase provides for this backend rather than hard-coded remembered values.

During traffic cutover, change only web-routing records that conflict with App Hosting for the apex and `www`.

The generated App Hosting domain remains an independent fallback endpoint. DNS rollback means restoring the prior captured web-routing records; propagation is not assumed to be instantaneous.

Reason: domain launch should not create collateral risk to email, ownership, or unrelated services.
