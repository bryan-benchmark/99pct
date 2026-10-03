# Canonicality

**Status:** Frozen for Missionism Protocol v0.1 publishing architecture  
**Last updated:** September 2026

## Rule

Any content displayed with a **CANONICAL** badge must originate from
`spec/canonical.json` via `src/protocol/canonical.ts`.

Current `spec/*.md` files may quote, index, explain, or operationalize
canonical claims, but may **not** independently supply text for a CANONICAL badge.

Explanatory website prose must **not** receive a CANONICAL badge.

**PROPOSED / EXPERIMENTAL / OPEN** content may live in page content or in
`docs/proposals/` and `docs/experiments/`. The public `MaturityBadge` component
only renders those three levels. Canonical rendering is owned exclusively by
`CanonicalClaim`.

## Dependency direction

```text
canonical.json
      ↓
canonical.ts
      ↓
CanonicalClaim   ← sole UI rendering path (incl. compact homepage variant)
```

No side entrance. Pages must not call `claim()` / `humanConstraint()` directly.

```text
specification (spec/)
     ↓
canonical primitives (spec/canonical.json → src/protocol/canonical.ts)
     ↓
website explanation (src/content/, pages)
```

Never maintain bidirectional sync between website essays and `spec/`.

## Human constraints

`claims.humansNotVariables` is the umbrella principle.

Individually identified constraints live in `humanConstraints` (HC-01…HC-05).

[`HUMAN_COMPACT.md`](../../spec/HUMAN_COMPACT.md) explains, interprets, and
illustrates them. It does **not** originate them.

## Editing claims

1. Change the string in `spec/canonical.json` only.
2. Expand context in `spec/CORE.md` / companions without inventing a second
   normative wording of the same claim.
3. Update `/changes` when a canonical claim or human constraint changes.
4. Keep canonical primitives **orthogonal** — do not add alternate phrasings of
   the same principle.
