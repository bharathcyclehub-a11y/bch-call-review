import { NextResponse } from "next/server";
import { getCachedCalls, processCalls } from "@/lib/plivo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "true";

  const authId = process.env.PLIVO_AUTH_ID;
  const authToken = process.env.PLIVO_AUTH_TOKEN;

  if (sync && authId && authToken) {
    try {
      const authStr = `${authId}:${authToken}`;
      const base64Auth = Buffer.from(authStr).toString("base64");
      const res = await fetch(
        `https://api.plivo.com/v1/Account/${authId}/Recording/?limit=100`,
        {
          headers: {
            Authorization: `Basic ${base64Auth}`,
          },
          next: { revalidate: 60 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const freshObjects = data.objects || [];
        if (freshObjects.length > 0) {
          // Merge fresh calls with cached calls
          return NextResponse.json(processCalls(freshObjects));
        }
      }
    } catch (e) {
      console.error("Live Plivo fetch failed, falling back to cache:", e);
    }
  }

  // Return full cached dataset
  const cached = getCachedCalls();
  return NextResponse.json(cached);
}
