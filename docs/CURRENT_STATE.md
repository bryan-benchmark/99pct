# Current State

Updated: 2026-10-04

## 99pct repository

- Public control plane and application repository: `bryan-benchmark/99pct`
- Sanitized predecessor snapshot accepted in WO-0003 and merged at `5486675`
- Security + CI baseline accepted in WO-0004 and merged at `edf10a6`
- Isolated 99pct deployment baseline accepted in WO-0005 and merged at `8d4c9b3`
- Mission foundation Start + Discover accepted in WO-0007 and merged at `6872a8c`
- Mission production-persistence readiness accepted in WO-0008 and merged at `754d785`
- Start + Discover production release accepted in WO-0009 and merged at `4643b4f`
- Projects + needed Work accepted in WO-0010 and merged at `2756ebd`
- Work interest accepted in WO-0011 and merged at `2fbfb93`
- Mutual Work participation accepted in WO-0012 and merged at `fcde732`
- Application source license: `AGPL-3.0-only`

## Product identity

99pct and Missionism are related but different.

**99pct is the product, platform, network, and Mission being built.**

**Missionism is the organizational protocol underneath it.**

A useful shorthand:

> 99pct is what we are building. Missionism is how it works.

99pct itself is one Mission built using Missionism.

## North star — a network for human commerce

99pct is intended to become a shared open-source commerce substrate with three human modes:

### Use

Ordinary people use 99pct alternatives for ordinary life:

- rides;
- stays;
- music;
- delivery;
- tools;
- care;
- local services;
- future utilities created by Missions.

The long-term consumer experience should feel simple: before using an incumbent, a human can check whether a useful 99pct option exists.

### Operate

Humans provide the real-world service:

- drivers;
- hosts;
- artists;
- couriers;
- clinicians where legally appropriate;
- local operators;
- other domain-specific service providers.

Operator software can be specialized for the utility while sharing identity, Mission, contribution, and economic rails.

### Build

Humans build and maintain the infrastructure:

- software;
- design;
- operations;
- legal/compliance work;
- safety systems;
- mapping;
- support;
- local launch work;
- research;
- other Projects, Work, and eventual bounties.

The current Mission → Project → Work → participation system is the beginning of this Build surface.

One human account may use more than one mode.

## Utility Missions and the spiderweb

99pct should not hard-code one giant Uber/Airbnb/Spotify clone into the core platform.

The target architecture is:

```text
99pct shared substrate
├── identity / trust
├── Mission graph
├── Projects / Work / bounties
├── Contribution / MCU history
├── rules / governance
├── money + legal rails (separate)
├── open-source artifacts / repositories
├── locality / discovery
└── reusable Mission blueprints
      ├── Rideshare 99
      ├── Stay 99
      ├── Music 99
      └── future utility Missions
```

A Utility Mission owns its domain-specific service experience. The shared substrate supplies the recurring human/economic infrastructure.

Long term, reusable blueprints may spawn new Missions or local Mission instances with explicit governance and safety gates. Example:

`Rideshare 99 blueprint → Atlanta Rideshare 99 → Decatur/local operating layer`

Automation may propose or instantiate infrastructure from a blueprint, but economic/legal activation must remain governed and auditable.

## Economic direction

The target is to keep useful economic value with the humans and communities creating it rather than defaulting to passive outside extraction.

For a Utility Mission:

- customers pay for a real service;
- operators earn for providing the service;
- infrastructure contributors can earn recognized Contribution / MCUs under published rules;
- Mission revenue and costs remain on a money ledger;
- MCUs remain a contribution ledger;
- legal ownership remains a separate legal ledger;
- the Mission publishes how revenue, reserves, infrastructure, operators, and any legal ownership interact.

99pct must not pretend that revenue, MCUs, and legal equity are the same asset.

The default design direction remains customer/revenue/non-equity financing rather than outside investor equity taking permanent control of Missions.

## Live product

Generated App Hosting URL:

`https://pct99--pct-99.us-central1.hosted.app`

Live release:

- deployed application commit: `28e2ff2`
- App Hosting build: `build-2026-10-04-014`
- automatic rollouts: off
- `/api/health`: ready
- `/api/missions/health`: ready
- `/api/workspace/health`: unavailable by design

The live functional loop is:

Mission → Project → Work → Interest → Creator invitation → Human confirmation → Helping

Production contains labeled alpha records from WO-0009 through WO-0012, including one confirmed helper on the test Work item.

These are shared 99pct primitives, not a Missionism website.

## Production Mission persistence

Dedicated Cloud SQL remains:

- project: `pct-99`
- region: `us-central1`
- instance: `pct99-missions-prod`
- PostgreSQL 18 Enterprise
- zonal `db-f1-micro`
- 10 GiB SSD with auto-growth
- automated backups enabled
- point-in-time recovery enabled
- deletion protection enabled
- public IP used through Cloud SQL Connector
- authorized networks empty

Database `missions` is migrated through `0005_work_participation.sql`.

Runtime role remains least privilege.

## Release compatibility rule

Mission health is forward-compatible with later additive migrations. While an older build is retained as a healthy rollback target, new production schema migrations must remain additive/backward-compatible with it.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not move apex/www traffic records until Firebase preparation is ready.

## Immediate product problem

The underlying Build primitives are useful, but the public shell still looks like the predecessor Missionism site.

The public application needs to explain the actual 99pct network:

- **Use 99pct** — customer utility layer;
- **Build 99pct** — Missions, Projects, Work, infrastructure;
- **Start a Mission** — create something that should exist;
- Missionism — protocol/supporting layer.

No 99pct consumer utility is live yet. The UI must say that rather than invent fake services.

## Active engineering work

Execute `docs/work-orders/WO-0013-99pct-product-shell.md`.

WO-0013 resets the shell around 99pct, introduces the Use / Build / Start architecture, adds public Work discovery, gives the future utility network an honest consumer entry surface, moves Missionism into a supporting protocol hub, and deploys the corrected shell.

WO-0013 has no database migration and must not add Contribution, MCUs, bounties/rewards, payments, equity, or custom-domain changes.
