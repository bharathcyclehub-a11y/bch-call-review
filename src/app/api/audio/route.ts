import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing execution id", { status: 400 });
  }

  const bolnaApiKey = process.env.BOLNA_API_KEY || "bn-781aff097f9e416c838804f2493b928a";

  try {
    const upstreamUrl = `https://api.bolna.ai/recordings/call/${id}`;
    const response = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${bolnaApiKey}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream Bolna audio returned ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const body = response.body;

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to proxy Bolna audio:", error);
    return new NextResponse("Audio streaming error", { status: 500 });
  }
}
