import Link from "next/link";
import { cookies } from "next/headers";
import { verifyHumanSession } from "@/human/auth/server";
import { humanSessionCookieName } from "@/human/auth/session";
import { missionDatabaseUnavailable } from "@/missions/db/config";
import { getMissionDb } from "@/missions/db/runtime";
import { listGrowthNotices } from "@/missions/growth";

export async function GrowthBanner() {
  const notices = await loadNotices();
  if (notices.length === 0) return null;
  return (
    <ul className="mb-8 space-y-2 border border-[var(--line)] p-4 font-[family-name:var(--font-sans)] text-sm">
      {notices.map((notice) => (
        <li key={`${notice.href}:${notice.text}`}><Link href={notice.href}>{notice.text}</Link></li>
      ))}
    </ul>
  );
}

async function loadNotices() {
  try {
    const identity = await verifyHumanSession((await cookies()).get(humanSessionCookieName)?.value);
    if (!identity) return [];
    return await listGrowthNotices(await getMissionDb(), identity.uid);
  } catch (error) {
    if (error instanceof Error && (error.message === missionDatabaseUnavailable || error.message === "Human authentication is not configured.")) return [];
    throw error;
  }
}
