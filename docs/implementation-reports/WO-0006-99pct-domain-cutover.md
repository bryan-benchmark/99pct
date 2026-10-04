# WO-0006 — 99pct.com domain cutover

Date: 2026-10-04

Status: **BLOCKED — DNS credentials/human action required**

Traffic was not changed. Nameservers were not changed. The registrar was not changed.

## Serving state before any DNS edit

| Item | Value |
|------|--------|
| Accepted `main` | `9d1cc6dd052904f67c925f868f6a0dd45aff432f` |
| Live build | `build-2026-10-04-006` |
| Live commit | `9d1cc6dd052904f67c925f868f6a0dd45aff432f` |
| Build state | `READY` |
| Traffic | 100% of that build |
| Automatic rollouts | off (`rolloutPolicy` unset) |
| Generated URL | `https://pct99--pct-99.us-central1.hosted.app` |
| Firebase project / backend | `pct-99` / `pct99` / `us-central1` |

GitHub Actions run `37217369127` on that commit passed both `functional` and `dependency-security`. The prior accepted application merge `8d4c9b3399cca45319be33176918f87e7ad8f0bd` also passed both jobs on run `37217132231`.

Smoke on the generated URL after the promotion: `/` returned 200 and `/api/health` returned 200, `Cache-Control: no-store`, `{"status":"ready","service":"99pct"}`.

The predecessor backend `missionism` in `us-east4` still has `updateTime` `2026-09-26T15:47:08.907741Z` and URI `missionism--missionism.us-east4.hosted.app`.

## Authoritative DNS

| Item | Value |
|------|--------|
| Registrar | Namecheap, Inc. |
| Authoritative DNS | Afternic |
| NS | `ns1.afternic.com`, `ns2.afternic.com` (authoritative TTL 86400) |
| SOA | `ns1.afternic.com` / `dns.jomax.net` |

Namecheap is the registrar only. It is not the DNS host. The Namecheap Personal DNS Server screen is the wrong place to add these records. Do not transfer the domain and do not change the nameserver delegation.

Public resolvers `1.1.1.1` and `8.8.8.8` both return the Afternic nameservers. Authoritative answers below were read from `ns1.afternic.com` and `ns2.afternic.com` on 2026-10-04.

## Rollback snapshot (apex and www web routing)

| Name | Type | TTL | Value |
|------|------|-----|--------|
| `99pct.com` | A | 3600 | `76.223.54.146` |
| `99pct.com` | A | 3600 | `13.248.169.48` |
| `www.99pct.com` | A | 3600 | `76.223.54.146` |
| `www.99pct.com` | A | 3600 | `13.248.169.48` |

No apex or www AAAA. No apex or www CNAME. No CAA records.

Preserved and not to be edited:

| Name | Type | TTL | Value |
|------|------|-----|--------|
| `99pct.com` | MX | 3600 | `0 .` (null MX) |
| `99pct.com` | TXT | 3600 | `v=spf1 -all` |
| `www.99pct.com` | TXT | 3600 | `v=spf1 -all` |
| `99pct.com` | NS | 86400 | `ns1.afternic.com`, `ns2.afternic.com` |

To roll back a later traffic cutover, restore the four A records above and remove only the App Hosting A records that replaced them. Leave the MX, SPF TXT, and NS records as they are. DNS rollback is not instantaneous.

## Firebase domain objects

Created on backend `pct99`, without changing DNS:

| Domain | Behavior | Host | Ownership | Certificate |
|--------|----------|------|-----------|-------------|
| `99pct.com` | serve the backend | `HOST_NON_FAH` | `OWNERSHIP_MISSING` | `CERT_VALIDATING` |
| `www.99pct.com` | 301 redirect to `https://99pct.com` | `HOST_NON_FAH` | `OWNERSHIP_MISSING` | `CERT_VALIDATING` |

Firebase's migration step 0 (ownership and certificate) is `INCOMPLETE`. Step 1 (direct traffic) is `PENDING`. Do not replace the apex or www A records until Firebase reports ownership and the certificate active.

## Human action: Afternic DNS, prepare records only

Add these records in the Afternic zone. Keep every existing record in the snapshot above.

| Action | Type | Host | Value |
|--------|------|------|--------|
| Add | TXT | `99pct.com` | `fah-claim=002-02-b3660e36-6f39-4281-80bc-09e6d0abb278` |
| Add | TXT | `www.99pct.com` | `fah-claim=002-02-b1c3927e-33cb-4416-8606-6caae2430fa1` |
| Add | CNAME | `_acme-challenge_37zms4qlx63nraqa.99pct.com` | `d6bc174f-76ef-48f4-927c-86a39ad200e7.17.authorize.certificatemanager.goog.` |

Afternic currently answers that ACME name with the parking A records and `v=spf1 -all`, which is wildcard behavior. The new CNAME has to override that one name. Do not delete the apex or www `v=spf1 -all` TXT records. Do not delete the apex or www A records in this step.

## Traffic records, not yet

When Firebase's migration step reaches direct-to-App-Hosting, and only then, replace the web A records with the records Firebase is showing now:

| Action | Type | Host | Value |
|--------|------|------|--------|
| Remove | A | `99pct.com` | `76.223.54.146` and `13.248.169.48` |
| Add | A | `99pct.com` | `35.219.200.1` |
| Remove | A | `www.99pct.com` | `76.223.54.146` and `13.248.169.48` |
| Add | A | `www.99pct.com` | `35.219.200.1` |

Keep the TXT records, including both `fah-claim` values and both `v=spf1 -all` values. Firebase has not requested an AAAA or CAA change. Re-read the live Firebase domain status before this step in case it issues different routing values.

## Not done

Custom-domain HTTPS, the apex smoke, the www redirect, and a post-cutover generated-URL check are waiting on the Afternic prepare records. No workspace database was connected.
