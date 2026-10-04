# Data model

Updated: 2026-10-04

This file separates the target product model from the predecessor schemas. WO-0001 does not add tables or migrations.

## Target objects

These are the concepts later work orders must be able to represent without collapsing them into one another.

| Object | Owns | Must not be stored as |
|---|---|---|
| Human | Public profile, authentication identifiers, links to provider verification status | A raw Social Security number, or a cash balance, or a legal share count with no issuance id |
| Mission | Purpose, place, constitution, contribution rules, legal-entity reference | A Firebase organization row copied forward without a decision |
| Project | Bounded outcome belonging to exactly one Mission | A Mission |
| Work | A public task or role under exactly one Project | A job offer, contract, payment, bounty, or MCU grant |
| Post | Communication attached to a Mission or Project | A governance decision |
| Proposal | A proposed change with discussion and, later, a vote | An automatic rule change |
| Contribution | Atomic evidence that something was done | An editable point balance |
| MCU grant | Append-only event produced from a Contribution under a named rule version | A transferable security, or a column that is overwritten |
| Contract | The agreement a human accepted for Work | A substitute for the equity ledger |
| Governance action | Proposal outcome, vote, or constitutional amendment | An MCU event |
| Equity settlement | A periodic conversion of eligible MCUs into a requested legal issuance | The stock ledger itself |
| Legal ownership reference | Pointer to an external issuance id, ledger, and document set | `user.equityPercent` as the source of truth |
| Money movement | Reference to payroll, payment, distribution, or financing at a partner | `user.cashBalance` held by 99pct |

An MCU event, when implemented, carries: contributor, Mission, rule and version, evidence, timestamp, issuer or authorizing process, and reason. That is SEC-006.

An equity settlement record may exist before any shares are issued. Its state stays "not yet issued" until SEC-007's external reference exists.

## Live public Mission domain

The dedicated Mission database now stores public Missions, Projects, and Work. These tables are not Workspace tables and they are not the predecessor JSON stores.

| Table | What it holds |
|---|---|
| `human_accounts` | Firebase uid and verified email. Public pages do not read this table. |
| `missions` | One forming Mission. `creator_uid` can create Projects and Work. It is not membership. |
| `mission_revisions` | Append-only public Mission description. |
| `projects` | One bounded outcome of exactly one Mission. Status is `active`. Slug is unique within the Mission. |
| `project_revisions` | Append-only title and outcome. Updates and deletes are rejected. |
| `work_items` | One `task` or `role` under exactly one Project. Status is `open`. Slug is unique within the Project. |
| `work_revisions` | Append-only title, description, and done-when. Updates and deletes are rejected. |
| `work_interests` | One immutable interest per human and Work item. The private note stays here. The verified email stays in `human_accounts` and is not copied onto the interest. |
| `work_invitations` | One immutable invitation from the Mission creator for an existing interest. A human cannot invite themself. |
| `work_confirmations` | One immutable confirmation of that invitation by the interested human. The human identity is the interest behind the invitation. |

Only the Mission creator can create a Project or Work. A different verified human can express interest in open Work after explicitly consenting to share their verified email with that creator. The creator may then invite that interest, and the same human may confirm. Participation is derived from those two append-only rows: interested, invited, or helping. It is not Mission membership, employment, contractor status, a legal contract, pay, an MCU award, or ownership. Work stays open, and more than one human can be helping. Public Work data includes an interest count and a helping count only. The note and email stay with the interested human and the Mission creator. Contribution and MCU records are not in this schema.

## Predecessor: public site and simulators

Before the Mission database, the public site had no product tables for Missions. Mission Units in `src/mission-units/types.ts` are in-memory domain types and a simulator page. Contribution events there already use reversal events and policy versions. That shape is worth learning from. It is not the production ledger, and its "Mission Units" name is not automatically the MCU ledger.

## Predecessor: feature branch file stores

On `feat/mission-workspace-v1`, these write JSON under `.data/` (or an env override):

| Store | Path pattern | Contents |
|---|---|---|
| Sparks | `.data/sparks/{id}/proposal.json` | Wish, name, people, place, pilot, evidence, ways to help |
| Spark interest | sibling files in the spark directory | One response category set per browser |
| Pilots | spark-scoped plan files | Candidate plans for an existing Spark |
| Experiments | `.data/experiments/{id}.json` | Proposal tied to a demo mission id |
| Team-ups and toolshare | `.data/teamups`, `.data/toolshare` | Demos |

These files are local prototype persistence. They are not an append-only MCU ledger and they are not on `origin/main`.

## Predecessor: Mission Workspace schema

PostgreSQL migrations `0001` through `0007` in `src/workspace/db/migrations/` on the feature branch:

| Table | Role |
|---|---|
| `workspace_users` | Firebase uid and email |
| `organizations` | Private organization name |
| `memberships` | `owner`, `editor`, `reviewer`; `active` or `revoked` |
| `contract_revisions` | Append-only Mission Contract answers |
| `decisions` | Decision identity bound to a contract revision |
| `decision_revisions` | Append-only decision content |
| `decision_reviews` | One review per decision revision |
| `audit_events` | Append-only audit, later given a per-organization sequence |
| `invitations` | Email-bound invites |
| `workspace_rate_limits` | Quota windows |
| `workspace_environment` | Database bound to a release target and Firebase project |

Triggers reject updates and deletes on contract revisions, decision revisions, decision reviews, and audit events. The runtime database role is documented as insert-and-select for history, with updates limited to memberships, invitations, and rate limits. Grants live in `scripts/workspace-runtime-grants.sql`.

Workspace "contract" is the seven-question Mission Contract draft, not an employment or equity agreement. Workspace "organization" is not yet a public Mission.

## Export formats to preserve

The workspace already has a customer JSON export with a schema version and SHA-256 checksum, plus `npm run workspace:verify-export`. A future Mission export must not discard that audit idea. It also must not pretend the workspace export is a full Mission contribution history. The workspace export is organization decisions and membership, and it can contain member emails.

## Fields that must not appear

```text
user.equityPercent = 2.4          as the ownership authority
user.cashBalance = 183292         as money 99pct holds
user.ssn = ...                    in the application database
mcu.balance overwritten in place  as history
```
