# Toolshare local demo

**Status:** Experimental product prototype. No real tools or loans are offered.

This is the first implementation of **Use a Mission** from [Mission Network v0](./MISSION_NETWORK_V0.md). It tests whether a person can find an available item, reserve it, check it out, return it, and flag an issue without forming a new organizational process for each interaction.

## Event protocol v1 (local)

Each action appends one immutable JSON event under `.data/toolshare/`. Events have `schemaVersion: 1`, `missionId: "toolshare-demo"`, a unique ID, ordered sequence, occurrence time, event type, tool ID, reservation ID, and a one-way hash of the browser cookie. The v1 vocabulary is:

- `tool.reserved`
- `tool.reservation_cancelled`
- `tool.checked_out`
- `tool.returned`
- `tool.issue_reported` (one of damaged, unsafe, missing part, other)

Availability and counts are derived from the events. A tool with an issue report stays unavailable for review even after return. There is no public raw-event endpoint; the page shows only aggregate demo counts and this browser's own reservations. The browser cookie is an abuse-limiting convenience, not identity or proof of a person.

The service's raw records stay local. A future cross-Mission learning query must have a declared purpose, approved fields and aggregates, minimum group size, and review before export. Simply removing names would not be a sufficient privacy guarantee.

## Boundaries

- Fictional inventory and local storage. No pickup, payment, insurance, equipment inspection, or legal lending terms.
- Reserve/check-out/return buttons generate demo events only. The counts are not evidence of real demand or service quality.
- No MCU, Mission Unit, ownership, or compensation event is created.
- Acquisition and operating costs are not measured. A real Toolshare pilot would record equipment cost, maintenance, loss, storage, labor, utilization, wait time, incidents, and actual member payments or subsidy before making economic claims.
- The demo deliberately has no incident-clearing button. A future real service needs a verified steward and a safety process before a flagged tool becomes available again.

## Acceptance

Concurrent reservations cannot claim the same tool. Only the reserving browser can progress or cancel its reservation. A return restores availability unless an issue was reported. A reported issue quarantines the item. Reloading the page derives the same state from the event log.
