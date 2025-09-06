// app/api/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DB, OUT, SEN, DEC, bump, summary, type Row } from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as any));

  const row: Row = {
    session_id: String(b.session_id || ""),
    timestamp: String(b.timestamp || new Date().toISOString()),
    outcome: String(b.outcome || "unknown"),
    sentiment: String(b.sentiment || "unknown"),
    rounds: b.rounds !== undefined ? Number(b.rounds) : undefined,
    decision: b.decision ? String(b.decision) : undefined,
  };

  if (!row.session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  DB.push(row);
  bump(OUT, row.outcome);
  bump(SEN, row.sentiment);
  if (row.decision) bump(DEC, row.decision);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(summary());
}