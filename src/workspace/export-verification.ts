import { createHash } from "node:crypto";

type RecordValue = Record<string, unknown>;

function object(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as RecordValue;
}

function rows(value: unknown, label: string): RecordValue[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((entry, index) => object(entry, `${label}[${index}]`));
}

function identifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) throw new Error(`${label} is missing.`);
  return value;
}

function unique(rowsToCheck: RecordValue[], field: string, label: string): Set<string> {
  const ids = new Set<string>();
  for (const row of rowsToCheck) {
    const id = identifier(row[field], `${label}.${field}`);
    if (ids.has(id)) throw new Error(`${label} contains a duplicate ${field}.`);
    ids.add(id);
  }
  return ids;
}

function eventKey(objectType: unknown, objectId: unknown, action: unknown, revision: unknown, invitationId: unknown = null) {
  return JSON.stringify([objectType, objectId, action, revision, invitationId]);
}

export function verifyOrganizationExport(value: unknown) {
  const exported = object(value, "Export");
  const checksum = object(exported.checksum, "Checksum");
  if (checksum.algorithm !== "sha256" || checksum.covers !== "JSON.stringify(export without checksum)" || typeof checksum.value !== "string" || !/^[a-f0-9]{64}$/.test(checksum.value)) {
    throw new Error("Export checksum metadata is invalid.");
  }
  const data = { ...exported };
  delete data.checksum;
  const computed = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  if (computed !== checksum.value) throw new Error("Export checksum does not match the records.");
  if (data.exportSchemaVersion !== 2) throw new Error("Unsupported export schema version.");
  const organization = object(data.organization, "Organization");
  const organizationId = identifier(organization.id, "Organization ID");
  const members = rows(data.members, "Members");
  const invitations = rows(data.invitations, "Invitations");
  const contracts = rows(data.contractRevisions, "Contract revisions");
  const decisions = rows(data.decisions, "Decisions");
  const revisions = rows(data.decisionRevisions, "Decision revisions");
  const reviews = rows(data.decisionReviews, "Decision reviews");
  const events = rows(data.auditEvents, "Audit events");
  const memberIds = unique(members, "user_id", "Members");
  const invitationIds = unique(invitations, "id", "Invitations");
  const decisionIds = unique(decisions, "id", "Decisions");
  unique(events, "id", "Audit events");
  const contractByRevision = new Map<number, RecordValue>();
  for (const contract of contracts) {
    const revision = Number(contract.revision);
    if (!Number.isSafeInteger(revision) || revision < 1 || contractByRevision.has(revision)) throw new Error("Contract revisions contain an invalid or duplicate revision.");
    if (!memberIds.has(identifier(contract.author_id, "Contract author"))) throw new Error("Contract author is absent from members.");
    contractByRevision.set(revision, contract);
  }
  for (const decision of decisions) {
    const bound = contractByRevision.get(Number(decision.contract_revision));
    if (!bound || bound.status !== "submitted") throw new Error("Decision is not linked to a submitted contract revision.");
    if (!memberIds.has(identifier(decision.created_by, "Decision creator"))) throw new Error("Decision creator is absent from members.");
  }
  const revisionByKey = new Map<string, RecordValue>();
  for (const revision of revisions) {
    const decisionId = identifier(revision.decision_id, "Decision revision parent");
    const number = Number(revision.revision);
    const key = `${decisionId}:${number}`;
    if (!decisionIds.has(decisionId) || !Number.isSafeInteger(number) || number < 1 || revisionByKey.has(key)) throw new Error("Decision revision has an invalid or duplicate parent and number.");
    if (!memberIds.has(identifier(revision.author_id, "Decision revision author"))) throw new Error("Decision revision author is absent from members.");
    revisionByKey.set(key, revision);
  }
  const reviewKeys = new Set<string>();
  for (const review of reviews) {
    const key = `${identifier(review.decision_id, "Review decision")}:${Number(review.revision)}`;
    const revision = revisionByKey.get(key);
    if (!revision || revision.status !== "submitted" || reviewKeys.has(key)) throw new Error("Review is not linked to a unique submitted decision revision.");
    const reviewer = identifier(review.reviewer_id, "Reviewer");
    if (!memberIds.has(reviewer) || reviewer === revision.author_id) throw new Error("Review lacks a distinct member reviewer.");
    reviewKeys.add(key);
  }
  for (const invitation of invitations) {
    if (!memberIds.has(identifier(invitation.invited_by, "Invitation creator"))) throw new Error("Invitation creator is absent from members.");
    if (invitation.accepted_by !== null && !memberIds.has(identifier(invitation.accepted_by, "Invitation recipient"))) throw new Error("Invitation recipient is absent from members.");
  }
  const expectedEvents = new Map<string, string>();
  const expectEvent = (objectType: string, objectId: unknown, action: string, revision: unknown, actorId: unknown, invitationId: unknown = null) => {
    const key = eventKey(objectType, objectId, action, revision, invitationId);
    if (expectedEvents.has(key)) throw new Error("Source records contain a duplicate audit transition.");
    expectedEvents.set(key, identifier(actorId, "Transition actor"));
  };
  const owners = members.filter((member) => member.role === "owner" && member.status === "active");
  if (owners.length !== 1) throw new Error("Export must contain one active owner.");
  expectEvent("organization", organizationId, "organization.created", null, owners[0].user_id);
  for (const contract of contracts) expectEvent("contract", organizationId, `contract.${contract.status === "submitted" ? "submitted" : "drafted"}`, contract.revision, contract.author_id);
  for (const revision of revisions) expectEvent("decision", revision.decision_id, `decision.${revision.status === "submitted" ? "submitted" : "drafted"}`, revision.revision, revision.author_id);
  for (const review of reviews) expectEvent("review", review.decision_id, `decision.${review.disposition}`, review.revision, review.reviewer_id);
  for (const invitation of invitations) {
    expectEvent("invitation", invitation.id, "invitation.created", null, invitation.invited_by);
    if (invitation.status === "revoked") expectEvent("invitation", invitation.id, "invitation.revoked", null, owners[0].user_id);
    if (invitation.status === "accepted") expectEvent("membership", invitation.accepted_by, "membership.joined", null, invitation.accepted_by, invitation.id);
  }
  let expectedSequence = BigInt(1);
  for (const event of events) {
    const sequence = event.org_seq;
    if ((typeof sequence !== "string" && typeof sequence !== "number") || !/^\d+$/.test(String(sequence)) || BigInt(sequence) !== expectedSequence) throw new Error("Audit event sequence has a gap or disorder.");
    expectedSequence++;
    if (!memberIds.has(identifier(event.actor_id, "Audit actor"))) throw new Error("Audit actor is absent from members.");
    if (typeof event.sequence_backfilled !== "boolean") throw new Error("Audit event history marker is invalid.");
    if (event.object_type === "organization" && event.object_id !== organizationId) throw new Error("Organization event refers to a different organization.");
    if (event.object_type === "invitation" && !invitationIds.has(identifier(event.object_id, "Invitation event target"))) throw new Error("Invitation event has no invitation record.");
    if ((event.object_type === "decision" || event.object_type === "review") && !decisionIds.has(identifier(event.object_id, "Decision event target"))) throw new Error("Decision event has no decision record.");
    if (event.action === "membership.revoked") {
      if (event.object_type !== "membership" || !memberIds.has(identifier(event.object_id, "Revoked member")) || event.actor_id !== owners[0].user_id) throw new Error("Membership revocation event is invalid.");
      continue;
    }
    const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload as RecordValue : {};
    const key = eventKey(event.object_type, event.object_id, event.action, event.revision, event.action === "membership.joined" ? payload.invitationId : null);
    const actor = expectedEvents.get(key);
    if (!actor || actor !== event.actor_id) throw new Error("Audit event does not match a source transition.");
    expectedEvents.delete(key);
  }
  if (expectedEvents.size) throw new Error("A source transition has no audit event.");
  return { organizationId, members: members.length, decisions: decisions.length, events: events.length };
}
