import { NextRequest, NextResponse } from "next/server";
import { DB, OUT, SEN, DEC, bump, type Row } from "@/lib/metrics";

// Minimal agent-complete logging endpoint for HR Web Call Trigger
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Partial<Row> & Record<string, unknown>;
  const row: Row = {
    session_id: String((b.session_id ?? (b as any).call_id ?? (b as any).sessionID ?? (b as any).sessionId) || crypto.randomUUID()),
    timestamp: String(b.timestamp || new Date().toISOString()),
    outcome: String(b.outcome || "completed"),
    sentiment: String(b.sentiment || "neutral"),
    rounds: b.rounds !== undefined ? Number(b.rounds) : undefined,
    decision: b.decision ? String(b.decision) : undefined,
  };
  DB.push(row);
  bump(OUT, row.outcome);
  bump(SEN, row.sentiment);
  if (row.decision) bump(DEC, row.decision);
  return NextResponse.json({ ok: true });
}


