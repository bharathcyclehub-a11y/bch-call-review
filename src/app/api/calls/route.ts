import { NextResponse } from "next/server";
import { getCachedCalls } from "@/lib/plivo";
import cachedPlivoCalls from "../../../../data/calls_cache.json";

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
      
      const freshObjects: any[] = [];
      let offset = 0;
      const knownKeys = new Set(
        (cachedPlivoCalls as any[]).map((c) => c.call_uuid || c.recording_id)
      );

      // Paginate through new Plivo recordings until reaching already-known calls
      for (let page = 0; page < 15; page++) {
        const res = await fetch(
          `https://api.plivo.com/v1/Account/${authId}/Recording/?limit=20&offset=${offset}`,
          {
            headers: {
              Authorization: `Basic ${base64Auth}`,
            },
            cache: "no-store",
          }
        );

        if (!res.ok) break;
        const data = await res.json();
        const items: any[] = data.objects || [];
        if (items.length === 0) break;

        let hitExisting = false;
        for (const item of items) {
          const key = item.call_uuid || item.recording_id;
          if (knownKeys.has(key)) {
            hitExisting = true;
            break;
          }
          freshObjects.push(item);
        }

        if (hitExisting || items.length < 20) break;
        offset += 20;
      }

      return NextResponse.json(getCachedCalls(freshObjects));
    } catch (e) {
      console.error("Live Plivo fetch failed, falling back to cache:", e);
    }
  }

  // Return full unified dataset
  const cached = getCachedCalls();
  return NextResponse.json(cached);
}
