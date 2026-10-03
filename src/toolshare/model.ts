export const tools = [
  { id: "drill", name: "Cordless drill", use: "Small household repairs", location: "Demo locker A" },
  { id: "washer", name: "Pressure washer", use: "Occasional outdoor cleaning", location: "Demo locker B" },
  { id: "tile-saw", name: "Tile saw", use: "One-off renovation work", location: "Demo locker C" },
] as const;

export type ToolId = (typeof tools)[number]["id"];
export const issueCodes = {
  damaged: "Damaged",
  unsafe: "May be unsafe",
  missingPart: "Missing part",
  other: "Other issue",
} as const;
export type IssueCode = keyof typeof issueCodes;

export type ToolEventType =
  | "tool.reserved"
  | "tool.reservation_cancelled"
  | "tool.checked_out"
  | "tool.returned"
  | "tool.issue_reported";

export type ToolEvent = {
  schemaVersion: 1;
  id: string;
  sequence: number;
  missionId: "toolshare-demo";
  occurredAt: string;
  type: ToolEventType;
  toolId: ToolId;
  reservationId: string;
  actorHash: string;
  issueCode?: IssueCode;
};

export type Reservation = {
  id: string;
  toolId: ToolId;
  actorHash: string;
  status: "reserved" | "out" | "returned" | "cancelled";
  issueCode?: IssueCode;
};

export type ToolState = {
  id: ToolId;
  name: string;
  use: string;
  location: string;
  status: "available" | "reserved" | "out" | "needs_review";
  activeReservationId?: string;
};

export type ToolshareSnapshot = {
  inventory: ToolState[];
  myReservations: Pick<Reservation, "id" | "toolId" | "status" | "issueCode">[];
  metrics: {
    requests: number;
    completedLoans: number;
    issues: number;
  };
};

export function deriveToolshare(events: ToolEvent[], actorHash?: string): ToolshareSnapshot {
  const reservations = new Map<string, Reservation>();
  const reported = new Set<ToolId>();
  const metrics = { requests: 0, completedLoans: 0, issues: 0 };

  for (const event of events) {
    if (event.type === "tool.reserved") {
      reservations.set(event.reservationId, {
        id: event.reservationId,
        toolId: event.toolId,
        actorHash: event.actorHash,
        status: "reserved",
      });
      metrics.requests += 1;
      continue;
    }
    const reservation = reservations.get(event.reservationId);
    if (!reservation) throw new Error(`Event ${event.id} references an unknown reservation.`);
    switch (event.type) {
      case "tool.reservation_cancelled":
        reservation.status = "cancelled";
        break;
      case "tool.checked_out":
        reservation.status = "out";
        break;
      case "tool.returned":
        reservation.status = "returned";
        metrics.completedLoans += 1;
        break;
      case "tool.issue_reported":
        reservation.issueCode = event.issueCode;
        reported.add(event.toolId);
        metrics.issues += 1;
        break;
    }
  }

  const inventory: ToolState[] = tools.map((tool) => {
    const active = [...reservations.values()].find((reservation) =>
      reservation.toolId === tool.id && (reservation.status === "reserved" || reservation.status === "out"));
    return {
      ...tool,
      status: reported.has(tool.id) ? "needs_review" : active?.status === "out" ? "out" : active ? "reserved" : "available",
      activeReservationId: active?.id,
    };
  });
  return {
    inventory,
    myReservations: [...reservations.values()]
      .filter((reservation) => reservation.actorHash === actorHash)
      .map(({ id, toolId, status, issueCode }) => ({ id, toolId, status, issueCode })),
    metrics,
  };
}

export type ToolAction =
  | { type: "reserve"; toolId: ToolId }
  | { type: "cancel" | "check_out" | "return"; reservationId: string }
  | { type: "report_issue"; reservationId: string; issueCode: IssueCode };

export function parseToolAction(value: unknown): ToolAction {
  if (typeof value !== "object" || value === null) throw new Error("Choose a valid action.");
  const record = value as Record<string, unknown>;
  if (record.type === "reserve" && typeof record.toolId === "string" && tools.some((tool) => tool.id === record.toolId)) {
    return { type: "reserve", toolId: record.toolId as ToolId };
  }
  if ((record.type === "cancel" || record.type === "check_out" || record.type === "return") && typeof record.reservationId === "string" && /^[0-9a-f-]{36}$/i.test(record.reservationId)) {
    return { type: record.type, reservationId: record.reservationId };
  }
  if (record.type === "report_issue" && typeof record.reservationId === "string" && /^[0-9a-f-]{36}$/i.test(record.reservationId) && typeof record.issueCode === "string" && record.issueCode in issueCodes) {
    return { type: "report_issue", reservationId: record.reservationId, issueCode: record.issueCode as IssueCode };
  }
  throw new Error("Choose a valid action.");
}
