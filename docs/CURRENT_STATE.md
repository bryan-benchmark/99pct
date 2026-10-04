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

## Product identity — corrected boundary

99pct and Missionism are related but different.

**99pct is the product, platform, and Mission being built.**

Its purpose is to make it easy for ordinary people to build the future together: start Missions, organize Projects, publish needed Work, join one another, record Contribution, earn MCUs under transparent rules, and eventually connect recognized contribution to legally valid ownership where a Mission implements that machinery.

**Missionism is the underlying organizational protocol / operating philosophy.**

Missionism explains how mission, human dignity, contribution, ownership, authority, governance, and incentives should fit together. 99pct uses Missionism; 99pct is not a renamed Missionism website.

A useful shorthand:

> 99pct is what we are building. Missionism is how it works.

99pct itself is one Mission built using Missionism.

The imported Missionism explanatory shell is predecessor material that gave the repository a starting application. It must not define the public 99pct product chrome going forward.

ADR-018 and WO-0013 make this distinction explicit.

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

These product objects are 99pct infrastructure. They are not evidence that the public shell should be branded Missionism.

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

Database `missions` is migrated through:

- `0001_missions.sql`
- `0002_environment.sql`
- `0003_projects_work.sql`
- `0004_work_interests.sql`
- `0005_work_participation.sql`

Runtime role remains least privilege.

## Release compatibility rule

Mission health is forward-compatible with later additive migrations:

- every migration known to the running build must exist in order with the expected checksum;
- later migrations unknown to that build may exist;
- missing, reordered, or changed known migrations fail readiness;
- the migration runner itself remains strict.

While an older build is retained as a healthy rollback target, new production schema migrations must remain backward-compatible/additive with that retained build.

## Firebase Auth

Email/Password is enabled.

The generated App Hosting host is authorized. `99pct.com` and `www.99pct.com` remain authorized for a future custom-domain cutover.

No service-account JSON is used.

## Domain cutover — waiting externally

WO-0006 / PR #11 remains parked while Afternic/Firebase ownership and certificate preparation propagates.

Do not move apex/www traffic records until Firebase preparation is ready.

## Current product problem

The underlying product loop is now useful, but the public shell still looks like the predecessor:

- homepage H1 is `Missionism`;
- global nav uses Missionism logo/wordmark assets;
- metadata defaults to Missionism;
- footer describes Missionism and exposes predecessor prototypes;
- `PRODUCT.md` previously described 99pct as merely “the product surface for Missionism.”

That framing is wrong for 99pct.

## Active engineering work

Execute `docs/work-orders/WO-0013-99pct-product-shell.md`.

WO-0013 resets the public product shell around 99pct, adds a real public Find Work surface, moves Missionism into a supporting protocol hub, preserves all accepted product data/behavior, and manually deploys the corrected shell after green CI.

WO-0013 has no database migration and must not add Contribution, MCUs, equity, payments, or custom-domain changes.
