# Specification

Normative short claims live only in [`canonical.json`](./canonical.json) in this repository.

That file was imported unchanged on 2026-10-03 from `bryan-benchmark/missionism` (`Missionism.com/spec/canonical.json`). The claim strings were not edited. The website still renders its own copy until a work order points it here. Do not edit both copies.

Rules:

- Change a claim only in this `canonical.json`, and only after an accepted Architecture Decision Record.
- Product docs in `/docs` may point at a claim key. They must not invent a second wording of the same claim.
- Explanatory website prose does not receive a CANONICAL badge. In the current application, a CANONICAL badge comes from that JSON through `src/protocol/canonical.ts`.
- If a product sentence and a canonical claim disagree, stop and write a proposed ADR.
