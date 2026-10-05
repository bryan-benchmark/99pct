# Next

Updated: 2026-10-04

## Active engineering

`WO-0016 — Contribution recognition + first MCU issuance`

See `docs/work-orders/WO-0016-first-mcu.md`.

Status:

**ACTIVE — CLOUD KMS SPEND APPROVED 2026-10-04**

### Approval gate — satisfied

Product owner explicitly approved on 2026-10-04:

> I approve the Cloud KMS spend for WO-0016.

Before the first real MCU is issued:

1. recheck current Cloud KMS pricing and `EC_SIGN_ED25519` support;
2. provision the non-exportable signing key;
3. verify worker-only signing IAM;
4. verify App Hosting has no signing permission;
5. prove a signed checkpoint can be independently verified.

If the expected KMS configuration or cost changes materially from the approved envelope, stop for renewed approval.

Current expected pricing is roughly $0.06/month for one active software key version plus $0.03 per 10,000 cryptographic operations, subject to current Google Cloud pricing at creation time.

### First real-value flow

After the gate is satisfied:

`confirmed helper → Contribution submission → creator/authorized recognition fact → isolated recognition bridge → kernel → MCU grant → signed checkpoint`

Key separation:

- helper submission is not economic value;
- Mission-side recognition is an immutable human/product fact;
- recognition service verifies the fact and submits through the recognition capability;
- the web app never receives the recognition credential;
- the kernel decides the MCU grant from the exact active rule;
- signed checkpoints anchor the resulting economic history.

### After WO-0016

1. **WO-0017 — Infrastructure Drip**
   Add the two-rail sustainability mechanism before general bounties:
   - additional MCU issuance for shared infrastructure Contribution;
   - separate cash protocol fee on the money ledger for real dollar costs;
   - immutable/versioned dependency-allocation rules;
   - protocol caps, delayed changes, public verification, and self-hosting without the hosted fee.

2. **WO-0018 — immutable bounty terms + autonomous MCU rewards**
   General bounties inherit the Infrastructure Drip rather than having it bolted on afterward.

3. **WO-0019 — public checkpoint/transparency hardening**
   Public signed checkpoints, recovery/rebuild drills, independent verifier packaging, and transparency publication.

4. money bounty connector

5. rule-governance hardening

6. Mission blueprints / Utility Missions

## Completed

- WO-0013 public 99pct shell
- WO-0014 deterministic economic kernel
- WO-0015 production economic shadow boundary

## Waiting externally

WO-0006 — 99pct.com domain cutover remains parked.
