import { NextResponse } from "next/server";
import { FeedbackData } from "@/lib/types";

// Server-side in-memory cache for feedback
const feedbackStore = new Map<string, FeedbackData>();

export async function GET() {
  return NextResponse.json({
    count: feedbackStore.size,
    feedback: Array.from(feedbackStore.values()),
  });
}

export async function POST(request: Request) {
  try {
    const body: FeedbackData = await request.json();
    if (!body || !body.call_id) {
      return NextResponse.json(
        { error: "call_id is required" },
        { status: 400 }
      );
    }

    body.updated_at = new Date().toISOString();
    feedbackStore.set(body.call_id, body);

    return NextResponse.json({
      success: true,
      call_id: body.call_id,
      stored_total: feedbackStore.size,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save feedback" },
      { status: 500 }
    );
  }
}
