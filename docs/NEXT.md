# Next

Updated: 2026-10-03

## Active decision gate

Resolve ADR-007 before application code enters this public repository.

Current recommendation:

- hosted application code: **AGPL-3.0**, to require source availability for modified network-hosted forks;
- protocol/document text: choose a separate share-alike documentation license if desired rather than assuming the software license expresses Mission governance rules.

This is a product-owner decision, not a Cursor implementation task.

## Immediately after the license decision

Create and execute the sanitized application snapshot work order using the accepted WO-0002 preflight.

That order will:

1. archive the exact tracked predecessor source tree;
2. apply the private publication denylist;
3. preserve 99pct control-plane files;
4. run standard secret scanning plus privacy/publication scanning;
5. run install, verify, lint, typecheck, and build;
6. add the application snapshot without private history;
7. open a PR without deploying or changing production infrastructure.

## Sequence after snapshot acceptance

1. CI/security gates in 99pct
2. deploy an unchanged baseline from 99pct
3. point 99pct.com at the verified baseline
4. start/discover a Mission
5. Projects + needed Work
6. Join
7. Contribution + append-only MCU history
8. export/tamper evidence/passkeys
9. legal-equity pilot only after the contribution foundation and appropriate legal design exist

One vertical slice at a time.
