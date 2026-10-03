# Specification pointer

Normative Missionism short claims have one source:

`/Users/bryangaines/Projects/Missionism/Missionism.com/spec/canonical.json`

That file is authoritative for protocol claims and human constraints. This repository does not contain a second `canonical.json`.

Rendering rule, already frozen in the application: a CANONICAL badge may only come from that JSON through `src/protocol/canonical.ts`. See `src/protocol/CANONICALITY.md` in the application.

Product docs in `/docs` describe how 99pct.com should behave. They do not replace `canonical.json`. If a product sentence and a canonical claim ever disagree, stop and write a proposed Architecture Decision Record. Do not edit the claim from this repository.
