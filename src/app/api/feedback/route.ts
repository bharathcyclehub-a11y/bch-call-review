import { NextResponse } from "next/server";
import { FeedbackData } from "@/lib/types";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      "SELECT raw_feedback FROM bch_call_reviews ORDER BY updated_at DESC"
    );
    const feedbackList = result.rows.map((r) => r.raw_feedback);
    return NextResponse.json({
      count: feedbackList.length,
      feedback: feedbackList,
    });
  } catch (error: any) {
    console.error("Failed to query feedback from database:", error);
    return NextResponse.json(
      { count: 0, feedback: [], error: error?.message },
      { status: 500 }
    );
  }
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

    const pool = getDbPool();
    await pool.query(
      `
      INSERT INTO bch_call_reviews (
        call_id, phone_number, lead_tier, agent_rating, tags,
        customer_query, agent_response_notes, general_notes,
        updated_at, raw_feedback
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        NOW(), $9
      )
      ON CONFLICT (call_id) DO UPDATE SET
        phone_number = EXCLUDED.phone_number,
        lead_tier = EXCLUDED.lead_tier,
        agent_rating = EXCLUDED.agent_rating,
        tags = EXCLUDED.tags,
        customer_query = EXCLUDED.customer_query,
        agent_response_notes = EXCLUDED.agent_response_notes,
        general_notes = EXCLUDED.general_notes,
        updated_at = NOW(),
        raw_feedback = EXCLUDED.raw_feedback;
      `,
      [
        body.call_id,
        body.phone_number || "",
        body.lead_tier || "warm",
        body.agent_rating || 3,
        JSON.stringify(body.tags || []),
        body.customer_query || "",
        body.agent_response_notes || "",
        body.general_notes || "",
        JSON.stringify(body),
      ]
    );

    return NextResponse.json({
      success: true,
      call_id: body.call_id,
      stored_in: "supabase",
    });
  } catch (error: any) {
    console.error("Failed to save feedback to database:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save feedback" },
      { status: 500 }
    );
  }
}
