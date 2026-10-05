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

## ADR-013 — Public Mission is a new PostgreSQL domain, not Spark or Workspace

Status: Accepted  
Date: 2026-10-04

The public 99pct `Mission` is a new product object.

Do not relabel either predecessor object as the Mission source of truth:

- a Spark is an idea/prototype proposal stored in local files;
- a Workspace organization is a private collaboration container.

A Mission starts in `forming` state and has its own PostgreSQL persistence model. The first model records the enduring public purpose, intended beneficiaries, starting place, creator identity, status, and append-only descriptive revisions.

Creation of a forming Mission does **not**:

- create a legal entity;
- issue MCUs;
- issue shares or other legal ownership;
- create a contract or payment obligation;
- certify the Mission as compliant with the protocol.

Public browsing is allowed without an account. Creating or mutating a Mission requires a verified human session.

Mission descriptions should be revisioned rather than silently overwritten so later governance can make changes explicit.

The production Mission database is not provisioned by WO-0007. Code and migrations are built/tested first; a later accepted work order binds a dedicated managed PostgreSQL environment before product writes go live.

## ADR-014 — Production Mission persistence uses isolated Cloud SQL PostgreSQL

Status: Accepted  
Date: 2026-10-04

The production Mission domain will use a dedicated Cloud SQL for PostgreSQL instance in Firebase/Google Cloud project `pct-99`, colocated in `us-central1` with the App Hosting backend.

The initial database major is PostgreSQL 18, matching the CI major.

Runtime connection rules:

- use the Cloud SQL Node.js Connector rather than raw public-IP allowlists;
- App Hosting's serving service account receives only Cloud SQL Client access needed to connect;
- database credentials/secrets live in Secret Manager, not Git;
- application runtime uses a least-privilege database user distinct from migration/administration credentials;
- production runtime must validate an explicit Mission environment binding before serving Mission data;
- Mission runtime must never fall back to the Workspace `DATABASE_URL`.

Data-safety rules:

- automated backups and point-in-time recovery are enabled before product writes go live;
- deletion protection is enabled;
- migrations are checksum-tracked and run explicitly, never opportunistically on each production request;
- append-only Mission revisions keep their database mutation guards;
- runtime grants do not include schema ownership or unrestricted update/delete.

Capacity starts small and can be upgraded without changing the Mission data model. A shared-core instance is acceptable for the early alpha despite having no Cloud SQL SLA, provided backups/PITR and health monitoring are in place.

Creating a recurring paid Cloud SQL resource requires explicit product-owner approval. Architectural acceptance does not itself authorize spend.

## ADR-015 — Initial Projects + Work are public plans, not economic commitments

Status: Accepted  
Date: 2026-10-04

A Project is a bounded outcome belonging to exactly one Mission.

Initial Work is a public request for help under exactly one Project.

Until the Join slice exists:

- only the Mission creator may create Projects or Work for that Mission;
- everyone may read public Projects and Work;
- no other Mission role or membership is implied.

Project and Work descriptions use append-only revision rows rather than silent in-place edits.

The initial Work model distinguishes only:

- `task` — a bounded thing that needs doing;
- `role` — an ongoing or repeating responsibility the Project needs.

An open Work item does **not** by itself create:

- employment;
- an independent-contractor relationship;
- a binding offer;
- payment or bounty entitlement;
- an MCU grant;
- legal equity;
- a contract;
- acceptance into the Mission.

The UI must say this plainly enough that a reasonable visitor does not mistake “open work” for a compensated job posting.

Join, acceptance, contracts, contribution evidence, compensation, MCUs, and legal ownership are later product states with separate authorization and legal/economic rules.

## ADR-016 — Initial Join is Work interest, not membership or assignment

Status: Accepted  
Date: 2026-10-04

The first Join action is Work-specific:

**I want to help**

A verified human may express interest in one open Work item.

This creates an immutable interest record. It does not itself:

- add the human as a Mission member;
- assign the Work;
- create employment or an independent-contractor relationship;
- create a contract;
- promise compensation;
- award MCUs;
- issue legal ownership;
- guarantee that the Mission creator will accept the human.

A human may express interest at most once per Work item in this initial slice.

The Mission creator cannot express interest in their own Mission’s Work.

Because 99pct does not yet have a public profile identity layer, the useful private contact identity is the human’s verified email. That email may be shown to the Mission creator **only after the human explicitly consents in the interest action**.

An optional interest note is private to the interested human and the Mission creator. It is not public content.

Public Work pages may show an aggregate interest count. They must not expose:

- verified email;
- Firebase uid;
- private interest note;
- session/auth data.

WO-0011 has no acceptance/decline state. Creator acceptance, agreement terms, assignment, Contribution, compensation, MCU rules, and ownership are separate later decisions.

## ADR-017 — Work participation requires mutual confirmation and is not a legal contract

Status: Accepted  
Date: 2026-10-04

A Work interest is not enough to say a human is doing the Work.

Initial Work participation requires two separate immutable actions:

1. **Creator invitation** — the Mission creator invites a human who already expressed interest in that specific Work item.
2. **Human confirmation** — that same human confirms: **I’ll help on this Work.**

Only after both records exist may the product describe that human as **helping on this Work**.

Neither action alone creates participation.

Rules:

- the creator may invite only an existing interested human;
- a human may confirm only an invitation addressed to their own verified identity;
- the creator cannot confirm on another human’s behalf;
- a human cannot self-invite;
- duplicate invite/confirm actions must be non-destructive;
- multiple humans may be mutually confirmed on the same Work item;
- the Work item remains `open` in this slice;
- invitation and confirmation history are append-only.

This mutual participation record does **not** by itself create:

- Mission membership;
- employment;
- independent-contractor status;
- a legally binding contract;
- compensation or bounty entitlement;
- an MCU grant;
- legal equity or ownership.

Public pages may expose aggregate helping count. Private participant identity remains visible only where already authorized: the participant themself and the Mission creator.

The confirmed participation relation exists so later Contribution records have a clear human + Mission + Project + Work context. Formal legal agreements are selected later when the actual activity requires them; they are not fabricated merely because two humans agreed to collaborate.

## ADR-018 — 99pct is the product/Mission; Missionism is the protocol underneath it

Status: Accepted  
Date: 2026-10-04

99pct and Missionism are not interchangeable brands.

**99pct** is the open-source product, platform, community surface, and Mission being built so people can build useful things together for the 99%, by the 99%.

Its product loop includes Missions, Projects, Work, human participation, Contribution records, MCUs, and—only where legally implemented—ownership and other economic rails.

**Missionism** is the open organizational protocol / operating philosophy that 99pct uses.

Missionism defines or explores rules for:

- mission alignment;
- human dignity and non-coercion;
- contribution recognition;
- progressive ownership;
- authority and agency;
- governance;
- incentives and long-term stewardship.

99pct itself is one Mission implemented using Missionism.

Consequences for the public product:

- the root application brand is 99pct, not Missionism;
- `99pct.com` is the canonical future product host;
- Missionism must not be the homepage H1, global wordmark, default metadata brand, or primary product navigation identity;
- Missionism remains accessible as supporting protocol material;
- existing Principles, How It Works, Specification, Open Questions, Changes, canonical claims, and protocol files remain available and should not be rewritten merely to market 99pct;
- predecessor Missionism demos/simulators may remain reachable for research/history but should not occupy primary 99pct product chrome;
- 99pct product copy must distinguish implemented features from future Contribution, MCU, ownership, governance, funding, or legal rails.

Short internal test:

> 99pct is what we are building. Missionism is how it works.

## ADR-019 — 99pct is a three-mode commerce network built from shared substrate + Utility Missions

Status: Accepted  
Date: 2026-10-04

99pct is designed as one network with three human modes:

1. **Use** — customers use Utility Missions for real-life services.
2. **Operate** — service providers deliver those services.
3. **Build** — contributors build and maintain the infrastructure.

A single human identity may participate in multiple modes.

99pct core should provide reusable primitives instead of hard-coding each vertical:

- identity/trust;
- Mission graph;
- Projects / Work;
- participation;
- Contribution / MCU history;
- governance/rules;
- money/legal connectors;
- open-source artifacts;
- locality/discovery;
- reusable Mission blueprints.

A **Utility Mission** provides domain-specific service logic on top of that substrate. Rideshare 99, Stay 99, Music 99, and future utilities are examples.

Reusable blueprints may later spawn/fork/localize Missions. Automation may propose or instantiate infrastructure, but regulated service activation, money, legal obligations, and ownership remain governed and auditable.

Product-surface rule:

- customer/operator/builder experiences may look very different;
- they should share identity and backend domain contracts rather than become unrelated products;
- start web/PWA where practical;
- add native shells when vertical requirements such as background location, media, low-latency interaction, or device integration justify them.

Economic rule:

- money, MCUs, and legal equity remain separate ledgers;
- Utility Mission customer revenue may fund operators, infrastructure, reserves, and growth under published rules;
- recognized builders/operators may earn MCUs;
- legal ownership may settle separately only where real legal machinery exists;
- the default design direction is to keep economic value with the humans/communities building and operating the service rather than giving permanent control to passive outside equity by default.

Bounties are a later Work mechanism and must not be implemented as promised MCU/money rewards before Contribution recognition and reward rails exist.

## ADR-020 — Economic state is an append-only deterministic kernel

Status: Accepted  
Date: 2026-10-04

MCUs, bounty rewards, Contribution recognition consequences, and future economic automation must be built on a small event-sourced economic kernel rather than ordinary mutable CRUD state.

### Source of truth

The authoritative record is an append-only per-Mission economic event stream.

Balances/statuses are derived views. They are not authoritative fields that application code may directly set.

Corrections append compensating events.

### Command boundary

All economic mutation begins as an explicit command with:

- Mission scope;
- actor/process;
- canonical command content;
- idempotency key;
- authorization context;
- relevant subject/evidence references.

The kernel validates authorization/idempotency/state/rule before atomically appending events.

The same logical command cannot create two economic outcomes.

### Rules

Published rule versions are immutable.

Every automated economic outcome references the exact rule/version used. Rule activation is itself history. New rule versions affect only future eligible commands/events; prior events are never recomputed under a new rule.

The first rule engine is intentionally constrained and declarative. Do not execute arbitrary Mission-supplied JavaScript or other code inside the economic decision boundary.

### Determinism

The economic core is a pure deterministic state transition over:

`prior authoritative events + command + exact rule version → refusal or event batch`

No network call, floating-point amount, current provider state, LLM output, or nondeterministic randomness may decide the economic result.

Time/IDs required for recording are injected after decision or as explicit command inputs and are not permitted to change reward math.

### AI boundary

AI may assist humans by drafting bounties, summarizing evidence, proposing classifications, or generating commands for review.

AI output cannot directly mint MCUs, trigger a money payout, or alter legal ownership.

### Units

MCU quantities use an integer smallest unit and fixed scale. Do not use JavaScript floating point as economic authority.

### Bounties

A bounty is a conditional reward contract whose terms/rule version become immutable for the accepted reward path.

Publishing, viewing, joining, or working on a bounty does not itself create a reward.

A reward requires an explicit satisfaction/recognition fact. The kernel then deterministically emits at most one reward for the stable reward key.

### External money and ownership

Money and legal ownership remain separate ledgers.

Economic events may request/reconcile external effects through idempotent post-commit connectors. External providers never become hidden mutable input to the deterministic kernel transaction.

### Verification

Economic events are sequence/hash linked and exportable. Independent verification/rebuild is a core feature, not an audit afterthought.

Later hardening may add signed/KMS-backed checkpoints and public transparency roots without changing the event semantics.

### Deployment

The first kernel work order is code + disposable PostgreSQL only.

No production MCU/bounty path is permitted until the kernel passes adversarial review and its invariants are mechanically tested.

## ADR-021 — Production economics uses capability-separated submitters and a private kernel writer

Status: Accepted  
Date: 2026-10-04

WO-0014 proved the deterministic economic kernel in source/disposable PostgreSQL.

Production integration adds a stricter authority boundary.

### Separate production database boundary

Initial production economics uses a separate PostgreSQL database, recommended name:

`economy`

on the already-approved Cloud SQL instance `pct99-missions-prod`.

This reuses the existing instance/backup/PITR/deletion-protection boundary while separating:

- database name;
- migrations;
- database users;
- secrets;
- runtime grants;
- operational tooling.

The Mission application database remains `missions`.

A later dedicated Cloud SQL instance may be justified for availability/blast-radius reasons without changing economic event semantics.

### Application does not own economic truth

App Hosting must not receive the private kernel-writer database credential.

The normal web application may only invoke a narrowly scoped intent-submission capability.

Intent rows are not authoritative economic events.

### Capability-separated submission

Authority must not come from a browser/client-supplied actor string.

Production intent submission is separated by capability/source.

At minimum distinguish:

- **human/application submission** — only human-safe command types;
- **recognition submission** — Contribution recognition / correction authority;
- **governance submission** — rule publication / activation authority;
- **bounty-recognition submission** — completion/satisfaction recognition authority.

A submitter cannot claim another capability by changing JSON.

Prefer database/API capabilities that derive process identity from the authenticated service/database role rather than accepting `actor.kind/ref` as user-controlled economic authority.

The deterministic kernel still performs business validation; SQL capability checks are a privilege boundary, not a second economic rules engine.

### Private kernel worker

Only the private kernel worker may use the kernel-writer credential.

The worker:

1. reads an immutable command intent;
2. derives/validates the trusted submission capability;
3. reconstructs and revalidates the economic command;
4. invokes the deterministic kernel;
5. appends accepted authoritative history or an append-only intent outcome;
6. is safe to retry or run concurrently.

A worker crash after economic commit must recover idempotently.

### Intent outcomes

Accepted/refused processing outcomes are append-only operational/audit facts keyed uniquely to the intent.

They do not replace the economic event stream.

### External checkpoints

Hash chaining detects mutation relative to an existing trusted root, but a database owner could theoretically rewrite and rehash the entire database.

Before real production MCU value is relied upon, 99pct adds externally verifiable signed checkpoints.

The signing key should be non-exportable and isolated from normal application credentials. Cloud KMS is the expected production implementation unless a later ADR chooses another authority.

Checkpoint format/signature verification must be testable independently of the live application.

Creating a new paid KMS resource requires explicit product-owner approval.

### Shadow-first deployment

The first production economic deployment is shadow infrastructure only.

It may create the economic database, users, secrets, migration history, worker/runtime boundary, health/operator tooling, and checkpoint integration scaffolding.

It must not create real MCU grants, bounty rewards, cash payouts, or ownership events.

## ADR-022 — First real MCU requires recorded Contribution recognition and a signed economic checkpoint

Status: Accepted  
Date: 2026-10-04

The first production MCU path must connect product facts to the economic kernel without giving the web application privileged economic credentials.

### Contribution submission

Only a human who is already mutually confirmed as helping on the target Work may submit a Contribution.

A Contribution submission is an immutable claim/evidence record.

Submission alone creates no MCU.

### Recognition

Recognition is a separate immutable fact.

For the first implementation, the Mission creator may recognize a submitted Contribution for Work inside their own Mission.

Recognition must record:

- Contribution id;
- Work / Project / Mission context;
- contributor identity reference;
- recognizer identity;
- recognized timestamp;
- evidence reference;
- rule id/version intended for economic evaluation.

Recognition cannot directly write the economic event stream.

### Recognition bridge

The web application records the recognition fact in Mission/product persistence.

A separate isolated recognition bridge/process:

1. reads only unbridged recognized Contributions;
2. re-verifies Mission ownership, confirmed participation, Contribution identity, and recognition integrity;
3. submits the deterministic `recognize_contribution` intent using the recognition capability;
4. records an append-only bridge outcome/reference;
5. is idempotent and safe to retry.

App Hosting does not receive the recognition-submitter credential.

### Rule publication

Initial MCU rules are immutable/versioned economic rules.

The first production rule may use the constrained `fixed_mcu_on_recognition` rule kind only.

The rule amount is not chosen per Contribution by the recognizer.

Rule publication/activation uses the governance capability and is not performed by ordinary web requests.

### Signed checkpoint requirement

Before any first production MCU grant is treated as released:

- Cloud KMS signing must be provisioned;
- the private signing key must be non-exportable;
- App Hosting must have no signing permission;
- the accepted economic history must be checkpoint-signed;
- signature verification must succeed independently.

External signing remains post-commit. If checkpoint creation fails, the economic event remains append-only but the product must not present the new MCU state as fully released/anchored until a valid checkpoint exists.

### Product semantics

MCUs remain recognized contribution units, not bearer securities or legal ownership.

The UI must not display MCU percentages as legal equity.

Money and legal ownership remain separate ledgers.

## ADR-023 — Infrastructure Drip uses separate MCU and cash rails

Status: Accepted  
Date: 2026-10-04

The Infrastructure Drip is the next economic-kernel extension after WO-0016 and before general bounties.

It exists to make shared 99pct infrastructure self-sustaining without turning MCUs into money or silently taxing a contributor's promised grant.

### Two rails

The Infrastructure Drip has two separate rails.

#### MCU rail

MCUs record recognized contribution.

When a recognition rule grants a contributor an amount, the contributor receives the full advertised amount.

Example:

```text
Contributor grant:        100 MCUs
Infrastructure issuance:    1 MCU
```

The infrastructure issuance is **additional issuance**, not a deduction from the contributor.

The starting design recommendation is 1 infrastructure MCU per 100 contributor MCUs, but the kernel must store the rate in an immutable/versioned rule. One percent is not a protocol constant.

The beneficiary of the infrastructure issuance is a **99pct Infrastructure Mission**, not a person, founder, parent company, or conventional corporate treasury.

That Infrastructure Mission exists to account for the shared work that makes downstream Missions possible: hosting, identity, maps, security, common software, support, legal/compliance infrastructure, and other shared dependencies.

Infrastructure Mission MCUs do not create an admin-controlled transferable pool. Human maintainers receive MCU recognition only through the same Contribution → recognition → versioned grant path used everywhere else.

### Dependency allocation

A Mission may later publish an immutable dependency-allocation rule.

Example:

```text
Infrastructure drip: 1%

40% → 99pct Core
25% → Open Maps Mission
20% → Identity Mission
10% → Safety Infrastructure Mission
 5% → other declared dependency Missions
```

The exact dependency set, rate, split, activation time, and version are part of the published economic rule.

A later change creates a new rule version. It does not rewrite prior grants.

No admin may edit dependency percentages in place.

### Cash rail

Dollars pay dollar costs.

The cash rail lives on the money ledger and is distinct from MCU issuance.

A hosted 99pct network may charge a small transparent protocol-maintenance fee on actual commerce. The intended design is cost-targeting rather than profit-maximizing.

Conceptually:

```text
fee_rate =
  clamp(
    forecast_shared_cost + reserve_refill
    -------------------------------
    trailing_network_commerce,
    protocol_min,
    protocol_max
  )
```

An illustrative starting range is approximately 0.25%–1.00% with a hard protocol maximum, but exact values remain future money-ledger rules and are not fixed by this ADR.

The cash fee:

- is not an MCU market;
- is not an MCU conversion;
- is not silently deducted from an advertised bounty reward;
- must be visible as a separate economic rule/fee;
- may decline as commerce grows faster than shared infrastructure cost.

### Protocol constraints

Both rails require:

1. **Protocol maximums**
   MCU-drip rate and hosted cash-fee rate have hard maximums.

2. **Delayed/versioned changes**
   Rate or dependency changes are new immutable versions with a future activation boundary; no instant silent edits.

3. **Public verification**
   Every MCU drip grant is exportable, hash-linked, checkpointed, and independently verifiable. Future money-fee settlement must be similarly auditable on the money rail.

4. **Open-source exit**
   The open-source 99pct tree can be operated independently without paying the hosted 99pct network fee. A hosted-network fee must compensate for hosted/shared services, not become a software-license toll.

### Bounties

General bounties are implemented only after the Infrastructure Drip.

A bounty promising 100 MCUs still grants the beneficiary 100 MCUs when its conditions are satisfied.

Any infrastructure issuance is separate, transparent, rule-derived additional issuance.

This lets every later bounty inherit the sustainability mechanism by construction.

### Three ledgers remain separate

The Infrastructure Drip does not change ADR-002:

- MCU/contribution ledger;
- money ledger;
- legal ownership ledger.

MCUs do not pay Google Cloud invoices.

Cash fees do not manufacture Contribution.

Neither rail automatically creates legal equity.
