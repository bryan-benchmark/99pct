/**
 * Canonical primitives for Missionism Protocol.
 *
 * Source of truth: spec/canonical.json
 *
 * Dependency: canonical.json → canonical.ts → CanonicalClaim
 * (no side entrance from spec/*.md into CANONICAL UI)
 *
 * Rule: Any UI marked CANONICAL must render text from here.
 * Explanatory prose must not receive a CANONICAL badge.
 */

import data from "../../spec/canonical.json";

export const protocol = Object.freeze(data.protocol);

export type ClaimId = keyof typeof data.claims;
export type HumanConstraintId = keyof typeof data.humanConstraints;

export const claims = Object.freeze(data.claims) as Readonly<
  Record<ClaimId, string>
>;

export const humanConstraints = Object.freeze(data.humanConstraints) as Readonly<
  Record<HumanConstraintId, string>
>;

export const claimIds = Object.keys(claims) as ClaimId[];
export const humanConstraintIds = Object.keys(
  humanConstraints,
) as HumanConstraintId[];

/** Stable public ids for human-floor constraints. */
export const humanConstraintCodes: Record<HumanConstraintId, string> = {
  equalStanding: "HC-01",
  freedomOfConscience: "HC-02",
  nonCoercion: "HC-03",
  humanDignity: "HC-04",
  reciprocity: "HC-05",
};

export function claim(id: ClaimId): string {
  return claims[id];
}

export function humanConstraint(id: HumanConstraintId): string {
  return humanConstraints[id];
}
