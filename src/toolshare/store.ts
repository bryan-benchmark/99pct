import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { deriveToolshare, type ToolAction, type ToolEvent, type ToolEventType } from "./model";

function root() {
  return process.env.MISSION_TOOLSHARE_DATA_DIR || path.join(process.cwd(), ".data", "toolshare");
}

function actorHash(browserId: string) {
  return createHash("sha256").update(browserId).digest("hex");
}

export class ToolshareError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function readEvents(): Promise<ToolEvent[]> {
  let names: string[];
  try {
    names = (await readdir(/* turbopackIgnore: true */ root()))
      .filter((name) => /^\d{8}\.json$/.test(name))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const events: ToolEvent[] = [];
  for (const name of names) {
    const event = JSON.parse(await readFile(path.join(/* turbopackIgnore: true */ root(), name), "utf8")) as ToolEvent;
    if (event.schemaVersion !== 1 || event.missionId !== "toolshare-demo" || event.sequence !== events.length + 1) {
      throw new Error("Toolshare event log is invalid.");
    }
    events.push(event);
  }
  return events;
}

async function withLock<T>(operation: () => Promise<T>): Promise<T> {
  await mkdir(root(), { recursive: true });
  const lockFile = path.join(root(), ".write-lock");
  let handle;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try {
      handle = await open(lockFile, "wx", 0o600);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const age = Date.now() - (await stat(lockFile)).mtimeMs;
        if (age > 30_000) await unlink(lockFile);
      } catch (inner) {
        if ((inner as NodeJS.ErrnoException).code !== "ENOENT") throw inner;
      }
      await delay(20);
    }
  }
  if (!handle) throw new ToolshareError(503, "Toolshare is busy. Try again.");
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(lockFile).catch(() => {});
  }
}

export async function getToolshareSnapshot(browserId?: string) {
  return deriveToolshare(await readEvents(), browserId ? actorHash(browserId) : undefined);
}

export async function applyToolAction(browserId: string, action: ToolAction) {
  return withLock(async () => {
    const events = await readEvents();
    const mine = deriveToolshare(events, actorHash(browserId));
    let type: ToolEventType;
    let toolId;
    let reservationId;
    let issueCode;

    if (action.type === "reserve") {
      const tool = mine.inventory.find((item) => item.id === action.toolId);
      if (!tool || tool.status !== "available") throw new ToolshareError(409, "This tool is unavailable.");
      type = "tool.reserved";
      toolId = action.toolId;
      reservationId = randomUUID();
    } else {
      const reservation = mine.myReservations.find((item) => item.id === action.reservationId);
      if (!reservation) throw new ToolshareError(404, "Reservation not found for this browser.");
      toolId = reservation.toolId;
      reservationId = reservation.id;
      if (action.type === "cancel") {
        if (reservation.status !== "reserved") throw new ToolshareError(409, "Only a reserved tool can be cancelled.");
        type = "tool.reservation_cancelled";
      } else if (action.type === "check_out") {
        if (reservation.status !== "reserved" || reservation.issueCode) throw new ToolshareError(409, "This tool cannot be checked out.");
        type = "tool.checked_out";
      } else if (action.type === "return") {
        if (reservation.status !== "out") throw new ToolshareError(409, "Only a checked-out tool can be returned.");
        type = "tool.returned";
      } else if (action.type === "report_issue") {
        if ((reservation.status !== "reserved" && reservation.status !== "out") || reservation.issueCode) {
          throw new ToolshareError(409, "An issue can only be reported once for an active reservation.");
        }
        type = "tool.issue_reported";
        issueCode = action.issueCode;
      } else {
        throw new ToolshareError(400, "Choose a valid action.");
      }
    }

    const event: ToolEvent = {
      schemaVersion: 1,
      id: randomUUID(),
      sequence: events.length + 1,
      missionId: "toolshare-demo",
      occurredAt: new Date().toISOString(),
      type,
      toolId,
      reservationId,
      actorHash: actorHash(browserId),
      ...(issueCode ? { issueCode } : {}),
    };
    const file = path.join(root(), `${String(event.sequence).padStart(8, "0")}.json`);
    const temporary = `${file}.${event.id}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(event), { flag: "wx", mode: 0o600 });
      await rename(temporary, file);
    } finally {
      await unlink(temporary).catch(() => {});
    }
    return { reservationId, snapshot: deriveToolshare([...events, event], actorHash(browserId)) };
  });
}
