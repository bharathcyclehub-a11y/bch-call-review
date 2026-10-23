import { NextResponse } from "next/server";
import { getCachedCalls } from "@/lib/plivo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "true";

  const authId = process.env.PLIVO_AUTH_ID || "MAYTA1YJJMMTKTMME2YI";
  const authToken = process.env.PLIVO_AUTH_TOKEN || "ZTA4ZmIxMGItZjEyZC00YTA5LTYzNTgtYmYwZDMw";

  if (sync && authId && authToken) {
    try {
      const authStr = `${authId}:${authToken}`;
      const base64Auth = Buffer.from(authStr).toString("base64");
      // Plivo caps each page at 20, fetch recent recordings
      const res = await fetch(
        `https://api.plivo.com/v1/Account/${authId}/Recording/?limit=20`,
        {
          headers: {
            Authorization: `Basic ${base64Auth}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const freshObjects = data.objects || [];
        return NextResponse.json(getCachedCalls(freshObjects));
      }
    } catch (e) {
      console.error("Live Plivo fetch failed, falling back to cache:", e);
    }
  }

  // Return full unified dataset (1,112 calls)
  const cached = getCachedCalls();
  return NextResponse.json(cached);
}
