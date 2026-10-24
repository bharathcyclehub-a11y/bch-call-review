import { NextResponse } from "next/server";
import { getCachedCalls } from "@/lib/plivo";
import { getAllPlivoRecordingsFromDb, syncNewPlivoRecordings } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "true";

  const authId = process.env.PLIVO_AUTH_ID || "MAYTA1YJJMMTKTMME2YI";
  const authToken = process.env.PLIVO_AUTH_TOKEN || "ZTA4ZmIxMGItZjEyZC00YTA5LTYzNTgtYmYwZDMw";

  // 1. If sync requested, pull latest recordings from Plivo and store directly into Supabase
  if (sync && authId && authToken) {
    try {
      await syncNewPlivoRecordings(authId, authToken);
    } catch (e) {
      console.error("Live Plivo sync failed:", e);
    }
  }

  // 2. Read all recordings from Supabase database
  let dbPlivo: any[] = [];
  try {
    dbPlivo = await getAllPlivoRecordingsFromDb();
  } catch (e) {
    console.error("Could not fetch from Supabase bch_plivo_recordings, falling back to cache:", e);
  }

  // 3. Process calls with deterministic 4-digit Lead IDs
  const responseData = getCachedCalls(dbPlivo);
  return NextResponse.json(responseData);
}
