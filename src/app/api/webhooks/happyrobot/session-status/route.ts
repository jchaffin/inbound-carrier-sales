import { NextRequest, NextResponse } from "next/server";
import { recordHrStatus } from "@/lib/metrics";

// Implements: https://docs.happyrobot.ai/webhook-payload-contract/session-status-change
export async function POST(request: NextRequest) {
  const event = await request.json();
  // Basic CloudEvents validation
  if (!event || event.type !== "session.status_changed" || !event.data) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const data = event.data;
  recordHrStatus({
    id: event.id,
    sessionId: data.session_id,
    previous: data.status?.previous,
    current: data.status?.current,
    updatedAt: data.status?.updated_at,
    time: event.time,
  });

  return NextResponse.json({ ok: true });
}


