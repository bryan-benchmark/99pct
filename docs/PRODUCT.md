# Product

Updated: 2026-10-04

## What 99pct is

99pct is an open-source network for human commerce: a place where people can **use**, **operate**, and **build** useful services together.

The long-term consumer idea is simple:

> Before using an incumbent, check whether the 99pct version is good enough.

A rider may choose Rideshare 99. A traveler may choose Stay 99. A listener may choose Music 99. The service should feel ordinary to the customer while the infrastructure underneath is open, forkable, contribution-aware, and designed so value can stay with the humans and communities creating it.

99pct itself is one Mission built using Missionism.

## Relationship to Missionism

**99pct is the product, network, and Mission.**

**Missionism is the organizational protocol underneath it.**

Missionism describes how mission, human dignity, contribution, authority, governance, incentives, and progressive ownership can fit together.

A human should not need to learn Missionism before requesting a ride, joining Work, or starting a Mission.

> 99pct is what we are building. Missionism is how it works.

## Three human modes

One identity may move among all three.

### Use

The customer-facing utility layer.

Examples:

- request a ride;
- book a stay;
- listen to music;
- find a local service;
- use a future 99pct utility.

The eventual consumer experience may be web, PWA, and native app surfaces over the same shared platform.

### Operate

The service-provider layer.

Examples:

- driver;
- host;
- artist;
- courier;
- local operator;
- domain-specific professional.

Operator experiences may require specialized native/device workflows, but identity, Mission context, Contribution, and economic rails should be shared rather than rebuilt per utility.

### Build

The infrastructure layer.

Builders create and maintain:

- software;
- design;
- safety systems;
- operations;
- legal/compliance work;
- local launch work;
- mapping;
- support;
- documentation;
- research;
- any other Mission Project / Work.

The current live Mission → Project → Work → participation system is the beginning of Build mode.

## The spiderweb, not a collection of clones

99pct should not become one monolith containing hard-coded copies of Uber, Airbnb, Spotify, and every future service.

The core platform supplies reusable primitives.

```text
99pct shared substrate
├── human identity + trust
├── Mission graph
├── Project / Work / bounty market
├── participation
├── Contribution evidence
├── MCU rules + history
├── money connectors
├── legal ownership connectors
├── governance / proposals
├── open-source artifacts + repositories
├── locality / discovery
└── reusable Mission blueprints
```

A Utility Mission plugs vertical-specific service logic into that substrate.

Examples:

```text
Rideshare 99
├── rider experience
├── driver/operator experience
├── matching / dispatch
├── safety / insurance / regulation
├── payments
└── shared 99pct Build + Contribution + MCU rails

Stay 99
├── guest experience
├── host experience
├── inventory / availability
├── safety / local regulation
└── same shared substrate

Music 99
├── listener experience
├── artist/operator experience
├── catalog / playback / licensing
└── same shared substrate
```

## Utility Missions and blueprints

A **Utility Mission** is a Mission whose output is a service people can actually use.

Long term, 99pct should support reusable Mission blueprints. A blueprint can package:

- open-source code;
- standard Projects;
- recurring Work;
- operating procedures;
- rules;
- integrations;
- compliance checklists;
- Contribution/MCU rules;
- deployment/localization instructions.

A blueprint can be forked or instantiated into another Mission.

Example:

```text
Rideshare 99 blueprint
→ Rideshare 99 infrastructure Mission
→ Atlanta Rideshare 99
→ local operating cells / service areas
```

Automation may eventually propose or instantiate Missions from proven blueprints, but activation of money, legal obligations, ownership, or regulated services must remain governed and auditable.

## The economic model

99pct keeps three ledgers separate:

1. **Money** — customer payments, operator pay, expenses, reserves, Mission revenue.
2. **Contribution / MCUs** — recognized human/infrastructure contribution.
3. **Legal ownership** — shares/units/options/other actual legal rights.

They can interact through published Mission rules. They are not the same thing.

For a Utility Mission, the design direction is:

- customers pay for a real service;
- operators receive the economics required to provide it;
- infrastructure builders can earn recognized Contribution/MCUs;
- the Mission funds maintenance, safety, support, reserves, and growth;
- legally valid ownership can accrue to builders/operators where the Mission's legal structure implements it;
- outside capital does not automatically receive permanent control merely because capital was supplied.

The goal is to keep more economic value with the humans and communities creating the service.

This is a direction, not a claim that current 99pct software already performs these distributions.

## Primary product loop

The shared Build loop is:

```text
discover or start a Mission
→ create a Project
→ publish needed Work
→ humans express interest
→ creator invites
→ human confirms
→ human contributes
→ Contribution is submitted
→ Contribution is reviewed / recognized
→ MCUs are granted under a versioned Mission rule
→ public contribution history grows
```

The utility loop adds:

```text
customer chooses a Utility Mission
→ service request enters vertical-specific system
→ operator fulfills it
→ money settles on the money rail
→ service/operator/infrastructure events may create Contribution evidence
→ Mission rules recognize Contribution separately
```

The current live implementation reaches mutual Work participation. It does not yet implement Contribution, MCU grants, bounties/rewards, consumer utilities, or money settlement.

## Economic kernel

Before Contribution recognition, MCUs, bounty rewards, or autonomous Mission economics go live, 99pct builds one shared economic kernel.

The kernel is intentionally small:

```text
command
→ authorize + idempotency check
→ deterministic versioned rule
→ append-only event batch
→ derived state
→ optional post-commit external effect
```

An MCU total is a sum/projection of immutable grant/adjustment events. It is not a mutable balance field.

A bounty reward is the deterministic consequence of immutable bounty terms plus an explicit completion/recognition fact. It is not a status toggle.

This same kernel should eventually support infrastructure builders, Utility Mission operators, automated bounty flows, and future revenue/ownership connectors without giving each vertical its own economic logic.

AI can assist with proposals/evidence but cannot directly generate economic value.


## Infrastructure Drip

99pct's shared infrastructure should be sustained by protocol rules rather than donations or permanent outside-equity extraction.

The design uses two separate rails.

### MCU infrastructure issuance

A recognition may create more than one rule-derived MCU grant.

A contributor receives the full grant promised by their rule. A separate additional grant may recognize shared infrastructure.

Example:

```text
Human Contribution recognized  → +100 MCUs to contributor
Infrastructure dependency rule  →   +1 MCU to 99pct Infrastructure Mission
```

The starting recommendation is a 1-for-100 rate, but the rate is stored in an immutable/versioned rule and may change only through a later rule version.

The Infrastructure Mission is not a founder treasury. Human infrastructure maintainers earn their own MCU recognition through normal Contribution → recognition → grant paths.

Dependency allocations may later split the infrastructure issuance among declared upstream Missions such as 99pct Core, maps, identity, and safety infrastructure.

### Cash infrastructure fee

Real operating expenses remain on the money rail.

Hosted 99pct services may eventually charge a small transparent cost-targeting protocol fee on real commerce. The fee is separately governed, capped, versioned, and intended to fall when shared costs grow more slowly than network commerce.

The hosted fee is not required merely to run the open-source code independently.

The MCU and cash rails must never be collapsed into one asset.

## Bounties

Bounties are a later Work mechanism, not a synonym for all Work.

A future bounty may publish a prospective reward such as:

- MCU amount/rule;
- money amount where legally/financially supported;
- both;
- another Mission-specific benefit.

A bounty must never imply reward issuance before completion/recognition conditions are satisfied.

Build the Contribution + recognition + MCU boundaries before adding bounty rewards.

## Current implementation truth

Live now:

- verified human accounts;
- public forming Missions;
- Projects;
- open task/role Work;
- public Mission / Project / Work reading;
- Work interest;
- explicit email-sharing consent;
- creator invitation;
- human confirmation;
- aggregate public interest/helping counts.

Not live yet:

- consumer Utility Missions;
- operator dashboards;
- Contribution submission;
- Contribution recognition;
- MCU issuance;
- bounty rewards;
- public contribution profiles;
- Mission blueprints;
- automatic Mission spawning;
- payments/revenue settlement;
- legal equity issuance;
- governance;
- funding rails.

The interface must never present future rails as already implemented.

## Product entry points

The 99pct shell should ultimately make the three directions obvious:

### Use 99pct
Find a useful 99pct alternative for ordinary life.

### Build 99pct
Browse open Work across Missions and help build the infrastructure.

### Start a Mission
Create something that should exist.

Operator entry points appear contextually inside live Utility Missions rather than as a fake empty global console.

## Contribution and MCU foundation

A self-reported action is not automatically recognized Contribution.

The system needs separate facts:

1. what a human says they did;
2. evidence;
3. recognition/review;
4. rule version;
5. resulting MCU grant.

MCUs are not bearer securities and are not automatically legal equity.

Each Mission should eventually publish a Contribution Constitution explaining how Contribution is recognized, which rule version applies, who/what can approve it, how it can be challenged, and how MCUs are calculated.

## Open source, locality, and compounding

The competitive advantage of 99pct should be compounding shared infrastructure.

A new local Mission should not need to rebuild:

- identity;
- payments connectors;
- Contribution history;
- MCU accounting;
- dispatch primitives;
- booking primitives;
- governance;
- legal workflow;
- common mobile shells;
- safety tooling

when those capabilities already exist as open shared infrastructure.

Local Missions can customize what must be local while reusing everything else.

This is the spiderweb: Missions can depend on, fork, fund, and contribute back to other Missions.

## Product architecture rule

Do not create a separate unrelated codebase for each utility unless a technical boundary truly requires it.

Prefer:

- shared APIs/domain primitives;
- shared identity;
- shared Mission graph;
- shared Contribution/MCU rails;
- vertical modules/adapters;
- web/PWA first where practical;
- native shells only when device/latency/background-location/media requirements justify them.

Rideshare will likely need native operator/customer surfaces earlier than a simple marketplace. That should still sit on the same 99pct backend contracts.

## Public Mission home

A mature Mission page should answer:

- What should exist?
- Who is it for?
- Is this a Utility Mission or infrastructure Mission?
- What can a customer use now?
- What Projects are active?
- What Work needs help?
- Who is helping?
- What Contribution has been recognized?
- How are MCUs earned?
- What money flows are real?
- What legal ownership, if any, has actually been issued?
- How are decisions made?
- What can I do now?
- What can I reuse or fork?

Every displayed figure must come from recorded data.

## Progressive identity/compliance

Do not front-load every regulated identity requirement onto ordinary participation.

A useful ladder remains:

1. Human account.
2. Contributor.
3. Utility operator when vertical rules require additional checks.
4. Paid contributor/operator when tax/payment requirements apply.
5. Owner/investor when legal ownership/investment requires it.
6. Trader only if regulated secondary trading ever exists.

99pct should not store raw SSNs merely to let someone start or help a Mission.

## Explicitly later

Not implied by current software:

- a universal Uber/Airbnb/Spotify clone;
- autonomous legal entities created without governance;
- buying/selling MCUs;
- a securities exchange;
- tokenized ownership;
- arbitrary admin-set ownership percentages;
- guaranteed pay for open Work;
- automatic employment/contractor relationships;
- automated revenue/equity distribution without legal/financial rails.

## Predecessor material

The repository began from a sanitized Missionism application snapshot. Its Sparks, Pilots, Mission Cells, Mines, Mission Units, Workspace tooling, simulators, and explanatory pages are predecessor research assets.

They do not define 99pct's product hierarchy.

The source of truth is the shared 99pct network described here and in accepted ADRs/work orders.
