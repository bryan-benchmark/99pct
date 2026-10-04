# WO-0006 — 99pct.com controlled domain cutover

## Goal

Connect the already-proven 99pct App Hosting backend to the public domain with minimal DNS blast radius.

Final public behavior:

- `https://99pct.com` serves the 99pct application;
- `https://www.99pct.com` redirects to `https://99pct.com`;
- HTTPS is valid on both hosts;
- the generated App Hosting URL remains available as a fallback;
- email and unrelated DNS continue unchanged;
- automatic App Hosting rollouts remain off;
- the predecessor Missionism deployment remains untouched;
- workspace readiness remains fail-closed.

This is a domain cutover order, not product work.

## Read

In addition to `AGENTS.md` and `docs/CURRENT_STATE.md`:

- ADR-007, ADR-010, ADR-011, ADR-012 in `docs/DECISIONS.md`
- `docs/DEPLOY.md`
- `docs/implementation-reports/WO-0005-deployment-baseline.md`
- current Firebase App Hosting custom-domain documentation

Use Firebase's **Migrate a domain** / preparation flow when available. Do not use remembered generic DNS values when Firebase provides domain-specific records.

## Branch

`wo/0006-99pct-domain-cutover`

## Hard boundaries

Do not:

- transfer the domain to another registrar;
- change authoritative nameservers merely to launch the site;
- transfer DNS hosting providers unless a separate accepted decision authorizes it;
- delete or change MX records;
- delete unrelated TXT records, including SPF, DKIM, DMARC, verification, or mail-provider records;
- change unrelated subdomains;
- change the predecessor Missionism Firebase project/backend/domain;
- provision or connect a workspace production database;
- enable automatic App Hosting rollouts;
- weaken dependency-security gates or extend ADR-010 exceptions;
- make product-feature changes.

Only apex/www web-routing and Firebase domain-verification records required for this cutover are in scope.

## 1. Start from accepted release state

Sync to current `main`.

Before DNS changes:

1. verify the current `main` SHA;
2. verify both GitHub Actions jobs are green for the accepted code;
3. manually promote the accepted `main` commit to backend `pct99` if the live App Hosting build does not already correspond to that accepted application state;
4. smoke `/` and `/api/health` on the generated `hosted.app` URL.

Automatic rollouts must remain off.

Record the exact commit/build serving before DNS cutover.

## 2. Discover the authoritative DNS control plane

Do not assume the registrar is the DNS provider.

Before changing anything, inspect live public DNS for `99pct.com`:

- registrar/RDAP or WHOIS registrar name;
- authoritative NS records;
- apex A and AAAA;
- apex CNAME/ALIAS/ANAME if the provider exposes one;
- `www` A/AAAA/CNAME;
- MX;
- relevant TXT;
- CAA.

Use public resolver evidence such as `dig` against at least one public resolver.

Identify the actual provider that hosts the authoritative zone from the NS records.

Important:

- Namecheap's **Personal DNS Server / Register Nameserver** screen is not the place to add normal A/CNAME/TXT records.
- If Namecheap is not authoritative for the zone, do not transfer the domain to Namecheap just to edit DNS.
- Do not change nameserver delegation as part of this work order.

Create a rollback snapshot of the **existing apex/www web-routing records and their TTLs** before any web-routing change.

The durable report may summarize NS/MX/TXT/CAA state, but do not dump unnecessary long DKIM keys or unrelated public TXT blobs.

## 3. Establish Firebase domain ownership/TLS first

In Firebase App Hosting for project `pct-99`, backend `pct99`:

1. add `99pct.com` as the primary custom domain using the migration/preparation flow;
2. configure `www.99pct.com` to redirect to `https://99pct.com` using App Hosting's supported redirect option;
3. use the exact verification/TLS preparation records Firebase provides.

During the **prepare/verify** phase:

- add only Firebase's required verification/certificate records;
- do not yet replace existing apex/www traffic records unless the Firebase migration flow explicitly reaches its traffic-direct step;
- preserve MX and unrelated TXT records;
- preserve nameserver delegation;
- preserve any existing web service until Firebase reports the preparation records verified.

If existing CAA records prevent Firebase certificate issuance, change CAA only after proving the restriction is the blocker and only enough to permit the certificate authorities Firebase currently requires.

Do not proceed to traffic cutover while Firebase still reports ownership/certificate preparation as unresolved.

## 4. Human DNS-access stop condition

If the authoritative DNS provider requires browser/account access that the agent does not have:

- finish all repository-only work;
- create the Firebase custom-domain request far enough to obtain the exact DNS records, if possible;
- record the authoritative DNS provider;
- record the exact required record edits in the PR/report;
- mark the work order `BLOCKED — DNS credentials/human action required`;
- stop before changing traffic.

The user should be asked only for the minimum provider-specific DNS edit. Do not ask them to transfer the domain or change nameservers.

## 5. Direct traffic only after preparation is ready

When Firebase's migration flow reaches **Direct to App Hosting**:

1. compare Firebase's required routing records with the rollback snapshot;
2. remove only conflicting apex/www A/AAAA/CNAME web-routing records that Firebase explicitly requires removed;
3. add the exact Firebase routing records shown by the domain wizard;
4. leave MX, unrelated TXT, NS, and unrelated subdomains unchanged;
5. verify the records from public resolvers;
6. wait for Firebase domain status and TLS to become connected/valid.

Do not hard-code a generic Firebase IP from documentation in place of the records shown for this domain.

## 6. Canonical-host behavior

Final behavior must be:

- `https://99pct.com/` → 200;
- `https://www.99pct.com/` → HTTP redirect to `https://99pct.com/`;
- paths on `www` preserve their path/query when redirected if App Hosting supports that behavior;
- `http://99pct.com` and `http://www.99pct.com` ultimately land on HTTPS;
- generated `hosted.app` URL remains reachable.

Do not create a second independent copy of the application for `www`.

## 7. Network smoke after cutover

Verify from outside the local machine/network where practical:

### Apex

- `https://99pct.com/` → 200
- `/principles` → 200
- `/how-it-works` → 200
- `/specification` → 200
- `/api/health` → 200 with `Cache-Control: no-store` and `{"status":"ready","service":"99pct"}`
- footer contains `Source (AGPL-3.0)` linking to the public repository
- TLS certificate is valid for `99pct.com`

### www

- `https://www.99pct.com/` redirects to `https://99pct.com/`
- TLS is valid for `www.99pct.com`

### Workspace

- `https://99pct.com/api/workspace/health` remains 503/unavailable;
- no workspace database is connected merely because the public domain is live.

### DNS collateral checks

Compare before/after:

- authoritative NS unchanged;
- MX unchanged;
- unrelated TXT records unchanged;
- unrelated subdomains not intentionally touched remain resolvable.

Inspect App Hosting request/error logs for the cutover smoke window. Do not commit private log payloads.

## 8. Rollback plan and proof

The rollback plan is the captured pre-cutover apex/www web-routing record set.

If the apex site, TLS, redirects, or health checks fail materially after the routing change:

1. restore the prior apex/www web-routing records exactly;
2. verify them from a public resolver;
3. confirm the previous web target recovers as DNS propagates;
4. keep the generated App Hosting URL available for diagnosis.

Do not claim DNS rollback is instantaneous.

A forced failure is not required merely to prove rollback. The exact captured prior records plus a reviewed restoration procedure are sufficient because intentionally breaking public DNS adds unnecessary risk.

## 9. Update deployment documentation

After successful cutover, update `docs/DEPLOY.md` so it reflects:

- canonical host `https://99pct.com`;
- `www` redirects to apex;
- generated `hosted.app` URL remains the fallback;
- authoritative DNS provider discovered during the work;
- automatic rollouts remain off;
- exact-commit manual promotion remains the release model;
- public health and source-link smoke checks;
- workspace health is separate and remains fail-closed until deliberately provisioned;
- high-level rollback procedure.

Do not store DNS-account credentials or secrets.

## 10. Durable report

Create:

`docs/implementation-reports/WO-0006-99pct-domain-cutover.md`

Include:

- accepted Git commit/build serving at cutover;
- authoritative registrar and DNS provider;
- authoritative NS set;
- before/after apex/www web-routing records and TTLs;
- confirmation that MX/unrelated TXT/NS were preserved;
- Firebase custom-domain status for apex and www;
- TLS status;
- apex/www redirect behavior;
- public route/health/source-link smoke results;
- workspace fail-closed result;
- generated-domain fallback result;
- automatic-rollout state;
- rollback snapshot/procedure;
- GitHub Actions evidence;
- any remaining infrastructure blockers.

Do not include credentials, access tokens, private account IDs not needed for operations, or secret values.

## Acceptance

1. `https://99pct.com` serves the accepted 99pct application over valid HTTPS.
2. `https://www.99pct.com` redirects to the apex over valid HTTPS.
3. Firebase App Hosting reports the custom domain connected/healthy.
4. The generated `hosted.app` endpoint remains healthy.
5. Automatic rollouts remain off.
6. Registrar ownership and nameserver delegation are unchanged.
7. MX and unrelated TXT records are unchanged.
8. Only required apex/www web-routing records changed.
9. Required public routes and `/api/health` pass on the apex.
10. The AGPL source link is present on the custom domain.
11. `/api/workspace/health` remains fail-closed.
12. Both GitHub Actions jobs are green for the accepted code.
13. Rollback records/procedure are captured.
14. `docs/DEPLOY.md` and the durable report reflect reality without secrets.
15. No predecessor infrastructure was modified.

## Return

Open the PR and stop.

Do not start Mission/Project/Work product implementation in this PR.
